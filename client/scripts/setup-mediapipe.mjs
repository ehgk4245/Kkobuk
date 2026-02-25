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

const MODELS = [
  {
    url: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
    file: 'pose_landmarker_lite.task'
  },
  {
    url: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
    file: 'face_landmarker.task'
  }
]

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

const pendingModels = MODELS.filter(({ file }) => !existsSync(join(DST, file)))

if (pendingModels.length === 0) {
  console.log('[setup-mediapipe] 모든 모델 파일 이미 존재, 건너뜀.')
  process.exit(0)
}

const downloadModel = ({ url, file }) =>
  new Promise((resolve, reject) => {
    console.log(`[setup-mediapipe] 다운로드 중: ${file}`)
    const dst = join(DST, file)
    const stream = createWriteStream(dst)
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`))
          return
        }
        const total = parseInt(res.headers['content-length'] || '0', 10)
        let received = 0
        res.on('data', (chunk) => {
          received += chunk.length
          if (total) process.stdout.write(`\r  ${file}: ${Math.round((received / total) * 100)}%   `)
        })
        res.pipe(stream)
        stream.on('finish', () => {
          stream.close()
          console.log(`\n  ✓ ${file}`)
          resolve()
        })
      })
      .on('error', reject)
  })

;(async () => {
  for (const model of pendingModels) {
    await downloadModel(model)
  }
  console.log('[setup-mediapipe] 완료!')
})()
