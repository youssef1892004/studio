use crate::timeline::Timeline;
use crate::engine::{s3, ffmpeg};
use anyhow::Result;
use std::path::PathBuf;
use tokio::fs;

pub async fn process_render_job(timeline: Timeline, job_id: String) -> Result<String> {
    let work_dir = PathBuf::from(format!("/tmp/media-engine/{}", job_id));
    let assets_dir = work_dir.join("assets");
    let output_dir = work_dir.join("output");
    let output_file = output_dir.join("output.mp4");

    // 1. Create directories
    fs::create_dir_all(&assets_dir).await?;
    fs::create_dir_all(&output_dir).await?;

    // 2. Download assets
    println!("Downloading assets for job {}", job_id);
    for track in &timeline.tracks {
        for clip in &track.clips {
            let (id, src) = match clip {
                crate::timeline::Clip::Video(v) => (&v.id, &v.src),
                crate::timeline::Clip::Image(i) => (&i.id, &i.src),
                crate::timeline::Clip::Audio(a) => (&a.id, &a.src),
            };
            
            let local_path = assets_dir.join(id);
            if !local_path.exists() {
                s3::download_file(src, &local_path).await?;
            }
        }
    }

    // 3. Render video
    println!("Rendering video for job {}", job_id);
    // This is blocking, so we might want to run it in a separate thread if we were doing this properly async
    // For now, blocking is "fine" for this MVP stage
    let output_path_clone = output_file.clone();
    let assets_dir_clone = assets_dir.clone();
    let timeline_clone = timeline.clone();
    
    tokio::task::spawn_blocking(move || {
        ffmpeg::render_video(&timeline_clone, &assets_dir_clone, &output_path_clone)
    }).await??;

    // 4. Upload result
    println!("Uploading result for job {}", job_id);
    let s3_url = s3::upload_file(&output_file, &format!("renders/{}.mp4", job_id), "studo-renders").await?;

    // 5. Cleanup
    let _ = fs::remove_dir_all(&work_dir).await;

    Ok(s3_url)
}
