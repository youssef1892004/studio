use wasm_bindgen::prelude::*;
use std::io::Cursor;
use symphonia::core::audio::SampleBuffer;
use symphonia::core::codecs::{DecoderOptions, CODEC_TYPE_NULL};
use symphonia::core::formats::FormatOptions;
use symphonia::core::io::MediaSourceStream;
use symphonia::core::meta::MetadataOptions;
use symphonia::core::probe::Hint;
use serde::Deserialize;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

// Helper to log to JS console
macro_rules! console_log {
    ($($t:tt)*) => (log(&format!($($t)*)))
}

#[wasm_bindgen]
pub fn init_panic_hook() {
    console_error_panic_hook::set_once();
}

#[wasm_bindgen]
pub fn generate_waveform_wasm(data: &[u8], target_points: usize) -> Result<Vec<f32>, JsValue> {
    console_log!("Rust: Received {} bytes of audio data", data.len());

    // Create a media source stream
    let cursor = Cursor::new(data.to_vec());
    let mss = MediaSourceStream::new(Box::new(cursor), Default::default());

    // Create a probe hint
    let hint = Hint::new();

    // Use the default options for format and decoder
    let format_opts: FormatOptions = Default::default();
    let metadata_opts: MetadataOptions = Default::default();
    let decoder_opts: DecoderOptions = Default::default();

    // Probe the media source
    let probed = symphonia::default::get_probe()
        .format(&hint, mss, &format_opts, &metadata_opts)
        .map_err(|e| JsValue::from_str(&format!("Probe failed: {}", e)))?;

    let mut format = probed.format;
    let track = format.tracks()
        .iter()
        .find(|t| t.codec_params.codec != CODEC_TYPE_NULL)
        .ok_or_else(|| JsValue::from_str("No supported audio track found"))?;

    let mut decoder = symphonia::default::get_codecs()
        .make(&track.codec_params, &decoder_opts)
        .map_err(|e| JsValue::from_str(&format!("Decoder creation failed: {}", e)))?;

    let track_id = track.id;

    let mut all_samples: Vec<f32> = Vec::new();
    let mut sample_rate = 0;
    let mut channels = 0;

    loop {
        let packet = match format.next_packet() {
            Ok(packet) => packet,
            Err(symphonia::core::errors::Error::IoError(_)) => break,
            Err(symphonia::core::errors::Error::ResetRequired) => {
                 return Err(JsValue::from_str("Reset required"));
            }
            Err(err) => return Err(JsValue::from_str(&format!("Packet error: {}", err))),
        };

        if packet.track_id() != track_id {
            continue;
        }

        match decoder.decode(&packet) {
            Ok(decoded) => {
                if sample_rate == 0 {
                    let spec = decoded.spec();
                    sample_rate = spec.rate;
                    channels = spec.channels.count();
                }

                let mut sample_buf = SampleBuffer::<f32>::new(decoded.capacity() as u64, *decoded.spec());
                sample_buf.copy_interleaved_ref(decoded);

                let samples = sample_buf.samples();
                for frame in samples.chunks(channels) {
                    let mut sum = 0.0;
                    for sample in frame {
                        sum += sample.abs();
                    }
                    all_samples.push(sum / channels as f32);
                }
            }
            Err(symphonia::core::errors::Error::IoError(_)) => break,
            Err(symphonia::core::errors::Error::DecodeError(_)) => continue,
            Err(err) => return Err(JsValue::from_str(&format!("Decode error: {}", err))),
        }
    }

    if all_samples.is_empty() {
        return Ok(vec![]);
    }

    let total_samples = all_samples.len();
    let chunk_size = (total_samples as f32 / target_points as f32).ceil() as usize;
    let mut peaks = Vec::with_capacity(target_points);

    for chunk in all_samples.chunks(chunk_size) {
        let mut max = 0.0;
        for &sample in chunk {
            if sample > max {
                max = sample;
            }
        }
        peaks.push(max);
    }

    console_log!("Rust: Generated {} peaks", peaks.len());
    Ok(peaks)
}

#[derive(Deserialize)]
struct MediaItem {
    id: String,
    r#type: String,
    src: Option<String>,
    url: Option<String>,
}

#[wasm_bindgen]
pub fn validate_media_item_wasm(json: &str) -> bool {
    let item: Result<MediaItem, _> = serde_json::from_str(json);
    match item {
        Ok(val) => {
            console_log!("Rust WASM: Validated item {} type {}", val.id, val.r#type);
            true
        },
        Err(e) => {
            console_log!("Rust WASM: Invalid item format: {}", e);
            false
        }
    }
}
