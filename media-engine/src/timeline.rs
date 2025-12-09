use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Timeline {
    pub width: u32,
    pub height: u32,
    pub fps: u32,
    pub tracks: Vec<Track>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Track {
    pub id: String,
    pub clips: Vec<Clip>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(tag = "type")]
pub enum Clip {
    #[serde(rename = "video")]
    Video(VideoClip),
    #[serde(rename = "image")]
    Image(ImageClip),
    #[serde(rename = "audio")]
    Audio(AudioClip),
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct VideoClip {
    pub id: String,
    pub src: String,
    pub start: f64, // Start time in the timeline (seconds)
    pub duration: f64, // Duration of the clip (seconds)
    pub offset: f64, // Start time within the source video (seconds)
    pub volume: Option<f32>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ImageClip {
    pub id: String,
    pub src: String,
    pub start: f64,
    pub duration: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AudioClip {
    pub id: String,
    pub src: String,
    pub start: f64,
    pub duration: f64,
    pub offset: f64,
    pub volume: Option<f32>,
}
