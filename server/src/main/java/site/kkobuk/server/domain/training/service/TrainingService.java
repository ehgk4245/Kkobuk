package site.kkobuk.server.domain.training.service;

import tools.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import site.kkobuk.server.domain.training.dto.TrainingUploadRequest;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.lambda.LambdaClient;
import software.amazon.awssdk.services.lambda.model.InvokeRequest;
import software.amazon.awssdk.services.lambda.model.InvocationType;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import site.kkobuk.server.global.error.ErrorCode;
import site.kkobuk.server.global.error.exception.BusinessException;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TrainingService {

    private final S3Client s3Client;
    private final LambdaClient lambdaClient;
    private final ObjectMapper objectMapper;

    @Value("${aws.s3.bucket}")
    private String bucket;

    @Value("${aws.lambda.function-name}")
    private String lambdaFunctionName;

    public void uploadAndTrain(Long memberId, TrainingUploadRequest request) {
        if (request.samples().size() < 500) {
            throw new BusinessException(ErrorCode.INVALID_INPUT_VALUE,
                    "학습 데이터 측정에 실패했습니다. 어깨부터 얼굴 전체가 나오는 정면을 바라보고 다시 측정해 주세요.");
        }
        String s3Key = uploadToS3(memberId, request);
        invokeLambda(memberId, s3Key, request);
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

            lambdaClient.invoke(
                    InvokeRequest.builder()
                            .functionName(lambdaFunctionName)
                            .invocationType(InvocationType.REQUEST_RESPONSE)
                            .payload(software.amazon.awssdk.core.SdkBytes.fromUtf8String(payload))
                            .build()
            );
        } catch (Exception e) {
            throw new RuntimeException("Lambda 호출 실패", e);
        }
    }
}
