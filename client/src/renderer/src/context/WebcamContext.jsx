import { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react'

const WebcamContext = createContext(null)

export function WebcamProvider({ children }) {
  const [stream, setStream] = useState(null)
  const [permissionError, setPermissionError] = useState(null)
  const [isRequesting, setIsRequesting] = useState(false)
  const streamRef = useRef(null)

  const requestPermission = useCallback(async () => {
    setIsRequesting(true)
    setPermissionError(null)
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      streamRef.current = mediaStream
      setStream(mediaStream)
      return true
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setPermissionError('카메라 접근이 거부되었습니다. 브라우저 설정에서 권한을 허용해 주세요.')
      } else if (err.name === 'NotFoundError') {
        setPermissionError('웹캠을 찾을 수 없습니다. 카메라가 연결되어 있는지 확인해 주세요.')
      } else {
        setPermissionError('카메라를 시작하는 중 오류가 발생했습니다: ' + err.message)
      }
      return false
    } finally {
      setIsRequesting(false)
    }
  }, [])

  useEffect(() => {
    requestPermission()
  }, [requestPermission])

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      setStream(null)
    }
  }, [])

  return (
    <WebcamContext.Provider
      value={{ stream, permissionError, isRequesting, requestPermission, stopStream }}
    >
      {children}
    </WebcamContext.Provider>
  )
}

export function useWebcam() {
  return useContext(WebcamContext)
}
