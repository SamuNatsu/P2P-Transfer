use std::sync::{Arc, Mutex};

use serde::Deserialize;
use serde_json::{Value, json};
use socketioxide::extract::{AckSender, Data, SocketRef};
use tracing::{debug, info, warn};

use crate::session::Session;

pub fn sender(s: SocketRef) {
    info!(id = s.id.as_str(), "sender: connected");

    // Shared session
    let session = Arc::new(Mutex::new(None));

    // Create new session
    #[derive(Debug, Deserialize)]
    struct NewData {
        file_name: String,
        file_mime: String,
        file_size: u64,
    }
    let session_1 = Arc::clone(&session);
    s.on(
        "new",
        move |s: SocketRef, Data::<NewData>(data), ack: AckSender| {
            // Is session exists
            let mut session = session_1.lock().unwrap();
            if session.is_some() {
                ack.send(&Value::Null).ok();
                s.emit("error", "existed").ok();
                warn!(id = s.id.as_str(), "sender: new: session existed");
                return;
            }

            // Create new session
            let (tmp, code) = Session::new(
                data.file_name.clone(),
                data.file_mime.clone(),
                data.file_size.clone(),
                s.clone(),
            );
            *session = Some(tmp);

            // Send ACK
            ack.send(&code).ok();

            // Print log
            debug!(data = ?data, "sender: new: data");
            info!(
                id = s.id.as_str(),
                code = code,
                "sender: new: session created"
            );
        },
    );

    // Forward signal messages
    let session_2 = Arc::clone(&session);
    s.on("forward", move |s: SocketRef, Data::<Value>(data)| {
        // Is session exists
        let session = session_2.lock().unwrap();
        if session.is_none() {
            s.emit("error", "not exists").ok();
            warn!(id = s.id.as_str(), "sender: forward: session not exists");
            return;
        }

        // Is session destroyed
        let session = session.as_ref().unwrap().upgrade();
        if session.is_none() {
            s.emit("error", "destroyed").ok();
            warn!(id = s.id.as_str(), "sender: forward: session destroyed");
            return;
        }

        // Is session connected
        let session = session.as_ref().unwrap().lock().unwrap();
        if session.receiver.is_none() {
            s.emit("error", "no receiver").ok();
            warn!(
                id = s.id.as_str(),
                "sender: forward: session has no receiver"
            );
            return;
        }

        // Forward data to receiver
        let receiver = session.receiver.as_ref().unwrap();
        receiver.emit("message", &data).ok();

        // Print log
        debug!(data = ?data, "sender: forward: data");
        info!(
            from = s.id.as_str(),
            to = receiver.id.as_str(),
            "sender: forward: ok"
        );
    });

    // Clean session on disconnect
    let session_3 = Arc::clone(&session);
    s.on_disconnect(move |s: SocketRef| {
        // Destroy session
        let session = session_3.lock().unwrap();
        if let Some(session) = session.as_ref() {
            if let Some(session) = session.upgrade() {
                let session = session.lock().unwrap();
                if let Some(receiver) = &session.receiver {
                    receiver.emit("destroyed", &Value::Null).ok();
                }
                session.destroy();
            }
        }

        // Print log
        info!(id = s.id.as_str(), "sender: disconnected");
    });
}

pub fn receiver(s: SocketRef) {
    info!(id = s.id.as_str(), "receiver: connected");

    // Shared session
    let session = Arc::new(Mutex::new(None));

    // Find session
    let session_1 = Arc::clone(&session);
    s.on(
        "find",
        move |s: SocketRef, Data::<String>(data), ack: AckSender| {
            // Is session found
            let tmp = Session::find(&data);
            if tmp.is_none() {
                ack.send(&Value::Null).ok();
                s.emit("error", "not found").ok();
                warn!(
                    id = s.id.as_str(),
                    code = data,
                    "receiver: find: session not found"
                );
                return;
            }

            // Store candidate session
            {
                let mut session = session_1.lock().unwrap();
                *session = tmp.clone();
            }

            // Is session destroyed
            let tmp = tmp.unwrap().upgrade();
            if tmp.is_none() {
                ack.send(&Value::Null).ok();
                s.emit("error", "destroyed").ok();
                warn!(
                    id = s.id.as_str(),
                    code = data,
                    "receiver: find: session destroyed"
                );
                return;
            }

            // Extract session data
            let tmp = tmp.unwrap();
            let tmp = tmp.lock().unwrap();

            // Send ACK
            ack.send(&json!({
                "file_name": tmp.file_name.clone(),
                "file_mime": tmp.file_mime.clone(),
                "file_size": tmp.file_size,
                "available": tmp.receiver.is_none(),
            }))
            .ok();

            // Print log
            debug!(session = ?tmp, "receiver: find: session");
            info!(id = s.id.as_str(), code = data, "receiver: find: ok");
        },
    );

    // Connect session
    let session_2 = Arc::clone(&session);
    s.on("connect", move |s: SocketRef| {
        // Is session has candidate
        let session = session_2.lock().unwrap();
        if session.is_none() {
            s.emit("error", "no candidate").ok();
            warn!(id = s.id.as_str(), "receiver: connect: no candidate found");
            return;
        }

        // Is session destroyed
        let session = session.as_ref().unwrap().upgrade();
        if session.is_none() {
            s.emit("error", "destroyed").ok();
            warn!(id = s.id.as_str(), "receiver: connect: session destroyed");
            return;
        }

        // Is session available
        let session = session.unwrap();
        let mut session = session.lock().unwrap();
        if session.receiver.is_some() {
            s.emit("error", "not available").ok();
            warn!(
                id = s.id.as_str(),
                "receiver: connect: session not available"
            );
            return;
        }

        // Update session receiver
        session.receiver = Some(s.clone());

        // Emit events
        s.emit("connected", &Value::Null).ok();
        session.sender.emit("connected", &Value::Null).ok();

        // Print log
        info!(id = s.id.as_str(), "receiver: connect: ok");
    });

    // Forward signal messages
    let session_3 = Arc::clone(&session);
    s.on("forward", move |s: SocketRef, Data::<Value>(data)| {
        // Is session exists
        let session = session_3.lock().unwrap();
        if session.is_none() {
            s.emit("error", "not exists").ok();
            warn!(id = s.id.as_str(), "receiver: forward: session not exists");
            return;
        }

        // Is session destroyed
        let session = session.as_ref().unwrap().upgrade();
        if session.is_none() {
            s.emit("error", "destroyed").ok();
            warn!(id = s.id.as_str(), "receiver: forward: session destroyed");
            return;
        }

        // Forward data to sender
        let session = session.as_ref().unwrap().lock().unwrap();
        session.sender.emit("message", &data).ok();

        // Print log
        debug!(data = ?data, "receiver: forward: data");
        info!(
            from = s.id.as_str(),
            to = session.sender.id.as_str(),
            "receiver: forward: ok"
        );
    });

    // Clean session on disconnect
    let session_4 = Arc::clone(&session);
    s.on_disconnect(move || {
        // Destroy session
        let session = session_4.lock().unwrap();
        if let Some(session) = session.as_ref() {
            if let Some(session) = session.upgrade() {
                let session = session.lock().unwrap();
                session.sender.emit("destroyed", &Value::Null).ok();
                session.destroy();
            }
        }

        // Print log
        info!("receiver: disconnected");
    });
}
