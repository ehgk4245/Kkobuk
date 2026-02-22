import { copyFileSync, existsSync, mkdirSync, createWriteStream } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import https from 'https'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const SRC_WASM = join(ROOT, 'node_modules/@mediapipe/tasks-vision/wasm')
const DST = join(ROOT, 'src/renderer/public/mediapipe-wasm')

const WASM_FILES = [
  'vision_wasm_internal.js',
  'vision_wasm_internal.wasm',
  'vision_wasm_nosimd_internal.js',
  'vision_wasm_nosimd_internal.wasm'
]

const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'
const MODEL_FILE = 'pose_landmarker_lite.task'

if (!existsSync(DST)) mkdirSync(DST, { recursive: true })

console.log('[setup-mediapipe] WASM 파일 복사 중...')
for (const file of WASM_FILES) {
  const dst = join(DST, file)
  if (existsSync(dst)) {
    console.log(`  ✓ ${file} (이미 존재)`)
    continue
  }
  copyFileSync(join(SRC_WASM, file), dst)
  console.log(`  ✓ ${file}`)
}

const modelDst = join(DST, MODEL_FILE)
if (existsSync(modelDst)) {
  console.log('[setup-mediapipe] 모델 파일 이미 존재, 건너뜀.')
  process.exit(0)
}

console.log('[setup-mediapipe] 모델 파일 다운로드 중...')
const file = createWriteStream(modelDst)

https
  .get(MODEL_URL, (res) => {
    if (res.statusCode !== 200) {
      console.error(`  ✗ 다운로드 실패 (HTTP ${res.statusCode})`)
      process.exit(1)
    }
    const total = parseInt(res.headers['content-length'] || '0', 10)
    let received = 0
    res.on('data', (chunk) => {
      received += chunk.length
      if (total) process.stdout.write(`\r  다운로드: ${Math.round((received / total) * 100)}%   `)
    })
    res.pipe(file)
    file.on('finish', () => {
      file.close()
      console.log(`\n  ✓ ${MODEL_FILE}`)
      console.log('[setup-mediapipe] 완료!')
    })
  })
  .on('error', (err) => {
    console.error('  ✗ 다운로드 오류:', err.message)
    process.exit(1)
  })
