mod handler;
mod middleware;
mod signal;

use std::env;

use anyhow::Result;
use axum::Router;
use mimalloc::MiMalloc;
use socketioxide::SocketIo;
use tokio::net::TcpListener;
use tower::ServiceBuilder;
use tower_http::{
    compression::CompressionLayer,
    decompression::DecompressionLayer,
    services::{ServeDir, ServeFile},
    trace::TraceLayer,
};
use tracing::info;

#[global_allocator]
static GLOBAL: MiMalloc = MiMalloc;

#[tokio::main]
async fn main() -> Result<()> {
    // Load dotenv
    #[cfg(debug_assertions)]
    dotenv::from_filename(".env.local").ok();
    #[cfg(not(debug_assertions))]
    dotenv::dotenv().ok();

    // Initialize tracing subscriber
    tracing_subscriber::fmt::init();

    // Create socket.io service
    let (sio_layer, sio) = SocketIo::builder().req_path("/ws").build_layer();
    sio.ns("/sender", handler::sender);
    sio.ns("/receiver", handler::receiver);

    // Create application
    let serve_dir = ServeDir::new("dist").fallback(ServeFile::new("dist/index.html"));
    let app = Router::new().fallback_service(serve_dir).layer(
        ServiceBuilder::new()
            .layer(CompressionLayer::new())
            .layer(DecompressionLayer::new())
            .layer(axum::middleware::from_fn(middleware::auth_guard))
            .layer(TraceLayer::new_for_http())
            .layer(sio_layer),
    );

    // Create listener
    let bind_addr = env::var("BIND_ADDR").unwrap_or("0.0.0.0".to_owned());
    let bind_port = env::var("BIND_PORT").unwrap_or("8080".to_owned()).parse()?;
    let listener = TcpListener::bind((bind_addr, bind_port)).await?;
    info!("start listening on http://{}", listener.local_addr()?);

    // Start serving
    axum::serve(listener, app)
        .with_graceful_shutdown(signal::shutdown_signal())
        .await?;

    // Quit
    info!("shutdown");
    Ok(())
}
