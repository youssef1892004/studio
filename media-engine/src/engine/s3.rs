use aws_sdk_s3::Client;
use aws_config::meta::region::RegionProviderChain;
use aws_config::BehaviorVersion;
use std::path::Path;
use tokio::io::AsyncWriteExt;
use anyhow::Result;

pub async fn download_file(url: &str, local_path: &Path) -> Result<()> {
    // Parse S3 URL (assuming format s3://bucket/key or https://endpoint/bucket/key)
    // For now, let's assume standard HTTP(S) URLs for simplicity as the frontend provides presigned or public URLs
    // If we need to handle s3:// protocol, we'll need parsing logic.
    
    if url.starts_with("http") {
        let response = reqwest::get(url).await?;
        let mut file = tokio::fs::File::create(local_path).await?;
        let content = response.bytes().await?;
        file.write_all(&content).await?;
        return Ok(());
    }

    // Fallback for S3 protocol if needed (requires credentials)
    // ... implementation for s3:// ...
    
    Err(anyhow::anyhow!("Unsupported URL scheme: {}", url))
}

pub async fn upload_file(local_path: &Path, key: &str, bucket: &str) -> Result<String> {
    let region_provider = RegionProviderChain::default_provider().or_else("eu-south-1");
    let config = aws_config::defaults(BehaviorVersion::latest())
        .region(region_provider)
        .load()
        .await;
    let client = Client::new(&config);

    let body = aws_sdk_s3::primitives::ByteStream::from_path(local_path).await?;

    client
        .put_object()
        .bucket(bucket)
        .key(key)
        .body(body)
        .acl(aws_sdk_s3::types::ObjectCannedAcl::PublicRead)
        .send()
        .await?;

    // Return public URL (assuming Wasabi/S3 standard)
    Ok(format!("https://s3.eu-south-1.wasabisys.com/{}/{}", bucket, key))
}
