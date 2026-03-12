package site.kkobuk.server.domain.training.service;

import tools.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import site.kkobuk.server.domain.training.dto.TrainingUploadRequest;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.lambda.LambdaClient;
import software.amazon.awssdk.services.lambda.model.InvokeRequest;
import software.amazon.awssdk.services.lambda.model.InvocationType;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import site.kkobuk.server.global.error.ErrorCode;
import site.kkobuk.server.global.error.exception.BusinessException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TrainingService {

    @Value("${training.model-limit:5}")
    private int modelLimit;

    @Value("${training.min-sample-count:500}")
    private int minSampleCount;

    private final S3Client s3Client;
    private final LambdaClient lambdaClient;
    private final ObjectMapper objectMapper;
    private final RestClient restClient = RestClient.create();

    @Value("${aws.s3.bucket}")
    private String bucket;

    @Value("${aws.lambda.function-name}")
    private String lambdaFunctionName;

    @Value("${ai.base-url}")
    private String aiBaseUrl;

    public void uploadAndTrain(Long memberId, TrainingUploadRequest request, String accessToken) {
        if (request.samples().size() < minSampleCount) {
            throw new BusinessException(ErrorCode.INVALID_INPUT_VALUE,
                    "학습 데이터 측정에 실패했습니다. 어깨부터 얼굴 전체가 나오는 정면을 바라보고 다시 측정해 주세요.");
        }
        checkModelLimit(accessToken);
        String s3Key = uploadToS3(memberId, request);
        invokeLambda(memberId, s3Key, request);
        invalidateFastApiCache(accessToken);
    }

    private void checkModelLimit(String accessToken) {
        try {
            ResponseEntity<List> response = restClient.get()
                    .uri(aiBaseUrl + "/api/models")
                    .header("Authorization", "Bearer " + accessToken)
                    .retrieve()
                    .toEntity(List.class);
            List<?> models = response.getBody();
            if (models != null && models.size() >= modelLimit) {
                throw new BusinessException(ErrorCode.INVALID_INPUT_VALUE,
                        "모델은 최대 " + modelLimit + "개까지만 학습할 수 있습니다. 기존 모델을 삭제 후 다시 시도해 주세요.");
            }
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("모델 조회 API 실패");
        }
    }

    private String uploadToS3(Long memberId, TrainingUploadRequest request) {
        try {
            String s3Key = "training-data/" + memberId + "/" + UUID.randomUUID() + ".json";
            byte[] body = objectMapper.writeValueAsBytes(request.samples());

            s3Client.putObject(
                    PutObjectRequest.builder()
                            .bucket(bucket)
                            .key(s3Key)
                            .contentType("application/json")
                            .build(),
                    RequestBody.fromBytes(body)
            );

            return s3Key;
        } catch (Exception e) {
            throw new RuntimeException("S3 업로드 실패", e);
        }
    }

    private void invokeLambda(Long memberId, String s3Key, TrainingUploadRequest request) {
        try {
            String payload = objectMapper.writeValueAsString(
                    Map.of("memberId", memberId, "s3Key", s3Key,
                           "name", request.name() != null ? request.name() : "",
                           "description", request.description() != null ? request.description() : "")
            );

            var response = lambdaClient.invoke(
                    InvokeRequest.builder()
                            .functionName(lambdaFunctionName)
                            .invocationType(InvocationType.REQUEST_RESPONSE)
                            .payload(software.amazon.awssdk.core.SdkBytes.fromUtf8String(payload))
                            .build()
            );

            if (response.functionError() != null) {
                log.error("[invokeLambda] Lambda 함수 오류: {}", response.payload().asUtf8String());
                throw new RuntimeException("학습 처리 중 오류가 발생했습니다.");
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Lambda 호출 실패", e);
        }
    }

    private void invalidateFastApiCache(String accessToken) {
        try {
            restClient.post()
                    .uri(aiBaseUrl + "/api/models/cache/invalidate")
                    .header("Authorization", "Bearer " + accessToken)
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception e) {
            log.warn("[invalidateFastApiCache] AI 서버 캐시 무효화 실패 (무시): {}", e.getMessage());
        }
    }
}
