export function readHandoverQr(raw) {
  const code = String(raw ?? "").trim();
  return /^\d{6}$/.test(code) ? code : null;
}

// One scanner session at a time; stop also invalidates pending permission/detect calls.
export function createQrScanner({
  video,
  onCode,
  onError,
  environment = globalThis,
  interval = 250,
}) {
  let generation = 0,
    stream = null,
    timer = null;
  function stop() {
    generation++;
    environment.clearTimeout(timer);
    timer = null;
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
    if (video) video.srcObject = null;
  }
  async function start() {
    stop();
    const session = generation;
    try {
      if (
        !environment.isSecureContext ||
        !environment.navigator?.mediaDevices?.getUserMedia
      )
        throw Error("الكاميرا تحتاج HTTPS؛ أدخل الرمز يدوياً أدناه.");
      const Detector = environment.BarcodeDetector;
      if (
        !Detector ||
        !(await Detector.getSupportedFormats()).includes("qr_code")
      )
        throw Error("المسح غير مدعوم بهذا المتصفح؛ أدخل الرمز يدوياً أدناه.");
      if (session !== generation) return;
      const detector = new Detector({ formats: ["qr_code"] });
      const incoming = await environment.navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      if (session !== generation) {
        incoming.getTracks().forEach((track) => track.stop());
        return;
      }
      stream = incoming;
      video.srcObject = stream;
      await video.play();
      if (session !== generation) return;
      async function detect() {
        if (session !== generation) return;
        try {
          if (video.readyState >= 2) {
            const results = await detector.detect(video);
            if (session !== generation) return;
            const code = results
              .map((result) => readHandoverQr(result.rawValue))
              .find(Boolean);
            if (code) {
              stop();
              onCode(code);
              return;
            }
          }
          timer = environment.setTimeout(detect, interval);
        } catch {
          if (session === generation) {
            stop();
            onError("تعذرت قراءة الرمز؛ أدخله يدوياً أو حاول مجدداً.");
          }
        }
      }
      await detect();
    } catch (error) {
      if (session !== generation) return;
      stop();
      onError(
        error.name === "NotAllowedError"
          ? "لم يُسمح بالكاميرا؛ أدخل الرمز يدوياً أو فعّل الإذن."
          : error.message || "تعذر فتح الكاميرا؛ أدخل الرمز يدوياً.",
      );
    }
  }
  return { start, stop };
}
