// Per-frame person mask from a video via Apple Vision person segmentation (.accurate), macOS only.
// Writes 8-bit grayscale PNGs at video size, person white, one per frame: out/NNNN.png (feed them to scripts/make-fg.py).
// usage: tools/matte take.mp4 out_dir
import AVFoundation
import Vision
import CoreImage
import ImageIO
import UniformTypeIdentifiers
let args = CommandLine.arguments
let url = URL(fileURLWithPath: args[1]); let out = args[2]
try? FileManager.default.createDirectory(atPath: out, withIntermediateDirectories: true)
let asset = AVURLAsset(url: url)
let track = asset.tracks(withMediaType: .video)[0]
let reader = try! AVAssetReader(asset: asset)
let o = AVAssetReaderTrackOutput(track: track, outputSettings: [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA])
reader.add(o); reader.startReading()
let ctx = CIContext()
let size = track.naturalSize
var i = 0
let req = VNGeneratePersonSegmentationRequest(); req.qualityLevel = .accurate; req.outputPixelFormat = kCVPixelFormatType_OneComponent8
while let sb = o.copyNextSampleBuffer() {
  guard let pb = CMSampleBufferGetImageBuffer(sb) else { continue }
  try! VNImageRequestHandler(cvPixelBuffer: pb).perform([req])
  let m = req.results![0].pixelBuffer
  var ci = CIImage(cvPixelBuffer: m)
  ci = ci.transformed(by: CGAffineTransform(scaleX: size.width / ci.extent.width, y: size.height / ci.extent.height))
  let cg = ctx.createCGImage(ci, from: CGRect(origin: .zero, size: size), format: .L8, colorSpace: CGColorSpaceCreateDeviceGray())!
  let dst = CGImageDestinationCreateWithURL(URL(fileURLWithPath: String(format: "%@/%04d.png", out, i)) as CFURL, UTType.png.identifier as CFString, 1, nil)!
  CGImageDestinationAddImage(dst, cg, nil); CGImageDestinationFinalize(dst)
  i += 1
  if i % 200 == 0 { print(i) }
}
print("done", i)
