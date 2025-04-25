use std::sync::{Arc, Mutex};

use axum::body::Bytes;
use serde::Deserialize;
use serde_json::json;
use socketioxide::extract::{AckSender, Data, SocketRef};

use crate::session::Session;

pub fn sender(s: SocketRef) {
    let session = Arc::new(Mutex::new(None));

    // Create new session
    #[derive(Deserialize)]
    struct NewData {
        file_name: String,
        file_mime: String,
        file_size: u64,
    }
    let session_1 = Arc::clone(&session);
    s.on(
        "new",
        move |s: SocketRef, Data::<NewData>(data), ack: AckSender| {
            let mut session = session_1.lock().unwrap();
            if session.is_some() {
                s.emit("error", "existed").ok();
                return;
            }

            let tmp = Session::new(data.file_name, data.file_mime, data.file_size, s.clone());
            *session = Some(tmp);

            ack.send(&[] as &[u8]).ok();
        },
    );

    // Forward signal messages
    let session_2 = Arc::clone(&session);
    s.on("forward", move |s: SocketRef, Data::<Bytes>(data)| {
        let session = session_2.lock().unwrap();
        if session.is_none() {
            s.emit("error", "not exists").ok();
            return;
        }

        let session = session.as_ref().unwrap().upgrade();
        if session.is_none() {
            s.emit("error", "destroyed").ok();
            return;
        }

        let session = session.as_ref().unwrap().lock().unwrap();
        if session.receiver.is_none() {
            s.emit("error", "no receiver").ok();
            return;
        }

        let receiver = session.receiver.as_ref().unwrap();
        receiver.emit("message", &data).ok();
    });

    // Clean session on disconnect
    let session_3 = Arc::clone(&session);
    s.on_disconnect(move || {
        let session = session_3.lock().unwrap();
        if let Some(session) = session.as_ref() {
            if let Some(session) = session.upgrade() {
                let session = session.lock().unwrap();
                session.destroy();
            }
        }
    });
}

pub fn receiver(s: SocketRef) {
    let session = Arc::new(Mutex::new(None));

    // Find session
    let session_1 = Arc::clone(&session);
    s.on(
        "find",
        move |s: SocketRef, Data::<String>(data), ack: AckSender| {
            let tmp = Session::find(&data);
            if tmp.is_none() {
                s.emit("error", "not found").ok();
                return;
            }

            {
                let mut session = session_1.lock().unwrap();
                *session = tmp.clone();
            }

            let tmp = tmp.unwrap().upgrade();
            if tmp.is_none() {
                s.emit("error", "destroyed").ok();
                return;
            }

            let tmp = tmp.unwrap();
            let tmp = tmp.lock().unwrap();

            ack.send(&json!({
                "file_name": tmp.file_name.clone(),
                "file_mime": tmp.file_mime.clone(),
                "file_size": tmp.file_size,
                "available": tmp.receiver.is_none(),
            }))
            .ok();
        },
    );

    // Confirm session
    let session_2 = Arc::clone(&session);
    s.on("confirm", move |s: SocketRef, ack: AckSender| {
        let session = session_2.lock().unwrap();
        if session.is_none() {
            s.emit("error", "no candidate").ok();
            return;
        }

        let session = session.as_ref().unwrap().upgrade();
        if session.is_none() {
            s.emit("error", "destroyed").ok();
            return;
        }

        let session = session.unwrap();
        let mut session = session.lock().unwrap();
        if session.receiver.is_some() {
            s.emit("error", "not available").ok();
            return;
        }

        session.receiver = Some(s.clone());

        ack.send(&[] as &[u8]).ok();
        session.sender.emit("connected", &[] as &[u8]).ok();
    });

    // Forward signal messages
    let session_3 = Arc::clone(&session);
    s.on("forward", move |s: SocketRef, Data::<Bytes>(data)| {
        let session = session_3.lock().unwrap();
        if session.is_none() {
            s.emit("error", "not exists").ok();
            return;
        }

        let session = session.as_ref().unwrap().upgrade();
        if session.is_none() {
            s.emit("error", "destroyed").ok();
            return;
        }

        let session = session.as_ref().unwrap().lock().unwrap();
        session.sender.emit("message", &data).ok();
    });

    // Clean session on disconnect
    let session_4 = Arc::clone(&session);
    s.on_disconnect(move || {
        let session = session_4.lock().unwrap();
        if let Some(session) = session.as_ref() {
            if let Some(session) = session.upgrade() {
                let session = session.lock().unwrap();
                session.destroy();
            }
        }
    });
}
