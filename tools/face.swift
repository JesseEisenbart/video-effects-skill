// Where the face sits in the 1080×1920 frame, for the FxSource `face` field. Samples the take at evenly spaced times, runs
// Vision face landmarks on each frame and prints the median as JSON: x = face centre, y = top of the face box, mouthY = lips.
// usage: tools/face take.mp4 [samples]
import AVFoundation
import Vision

let args = CommandLine.arguments
let asset = AVURLAsset(url: URL(fileURLWithPath: args[1]))
let samples = args.count > 2 ? Int(args[2])! : 9
let gen = AVAssetImageGenerator(asset: asset); gen.appliesPreferredTrackTransform = true
gen.requestedTimeToleranceBefore = .zero; gen.requestedTimeToleranceAfter = .zero
let duration = CMTimeGetSeconds(asset.duration)
var xs: [Double] = [], ys: [Double] = [], mouths: [Double] = []
for k in 0..<samples {
  let t = duration * (Double(k) + 0.5) / Double(samples)
  guard let img = try? gen.copyCGImage(at: CMTime(seconds: t, preferredTimescale: 600), actualTime: nil) else { continue }
  let req = VNDetectFaceLandmarksRequest()
  try? VNImageRequestHandler(cgImage: img).perform([req])
  guard let f = req.results?.max(by: { $0.boundingBox.width < $1.boundingBox.width }), let lips = f.landmarks?.outerLips else { continue }
  let W = Double(img.width), H = Double(img.height)
  // The take is drawn with objectFit: cover into 1080×1920.
  let s = max(1080 / W, 1920 / H), ox = (1080 - W * s) / 2, oy = (1920 - H * s) / 2
  let bb = f.boundingBox
  xs.append(bb.midX * W * s + ox)
  ys.append((1 - bb.maxY) * H * s + oy)
  let pts = lips.pointsInImage(imageSize: CGSize(width: W, height: H))
  mouths.append((H - pts.map { Double($0.y) }.reduce(0, +) / Double(pts.count)) * s + oy)
}
guard !xs.isEmpty else { FileHandle.standardError.write("no face found\n".data(using: .utf8)!); exit(1) }
func median(_ a: [Double]) -> Int { Int(a.sorted()[a.count / 2].rounded()) }
print("{ \"x\": \(median(xs)), \"y\": \(median(ys)), \"mouthY\": \(median(mouths)) }")
