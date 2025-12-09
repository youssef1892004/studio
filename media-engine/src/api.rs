use actix_web::{post, web, HttpResponse, Responder};
use crate::timeline::Timeline;
use serde_json::json;

pub mod waveform;


#[post("/render")]
pub async fn render_timeline(timeline: web::Json<Timeline>) -> impl Responder {
    let job_id = uuid::Uuid::new_v4().to_string();
    println!("Received render request for job {}", job_id);
    
    let timeline_data = timeline.into_inner();
    let job_id_clone = job_id.clone();

    // Spawn background task
    tokio::spawn(async move {
        match crate::engine::renderer::process_render_job(timeline_data, job_id_clone.clone()).await {
            Ok(url) => println!("Job {} completed: {}", job_id_clone, url),
            Err(e) => println!("Job {} failed: {}", job_id_clone, e),
        }
    });
    
    HttpResponse::Ok().json(json!({
        "status": "queued",
        "job_id": job_id,
        "message": "Render job started"
    }))
}
