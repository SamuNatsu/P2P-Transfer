use tokio::signal;

pub async fn shutdown_signal() {
    // SIGINT
    let sigint = async {
        signal::ctrl_c()
            .await
            .expect("fail to install SIGINT handler");
    };

    // SIGTERM
    #[cfg(unix)]
    let sigterm = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("fail to install SIGTERM handler")
            .recv()
            .await;
    };
    #[cfg(not(unix))]
    let sigterm = std::future::pending::<()>();

    // Wait signals
    tokio::select! {
        _ = sigint => {},
        _ = sigterm => {},
    };
}
