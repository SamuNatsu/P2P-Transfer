use std::sync::{Arc, Mutex};

use anyhow::Result;
use serde::Deserialize;
use serde_json::{Value, json};
use socketioxide::extract::{AckSender, Data, SocketRef};
use tracing::{debug, error, info, warn};

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
            let tmp_s = s.clone();
            let wrapper = move || -> Result<()> {
                // Is session exists
                let mut session = session_1.lock().unwrap();
                if session.is_some() {
                    ack.send(&Value::Null)?;
                    s.emit("error", "existed")?;
                    warn!(id = s.id.as_str(), "sender: new: session existed");
                    return Ok(());
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
                ack.send(&code)?;

                // Print log
                debug!(data = ?data, "sender: new: data");
                info!(
                    id = s.id.as_str(),
                    code = code,
                    "sender: new: session created"
                );

                // Success
                Ok(())
            };

            if let Err(err) = wrapper() {
                error!(id = tmp_s.id.as_str(), err = ?err, "sender: unexpected error");
                tmp_s.emit("error", &err.to_string()).ok();
            }
        },
    );

    // Forward signal messages
    let session_2 = Arc::clone(&session);
    s.on("forward", move |s: SocketRef, Data::<Value>(data)| {
        let tmp_s = s.clone();
        let wrapper = move || -> Result<()> {
            // Is session exists
            let session = session_2.lock().unwrap();
            if session.is_none() {
                s.emit("error", "not exists")?;
                warn!(id = s.id.as_str(), "sender: forward: session not exists");
                return Ok(());
            }

            // Is session destroyed
            let session = session.as_ref().unwrap().upgrade();
            if session.is_none() {
                s.emit("error", "destroyed")?;
                warn!(id = s.id.as_str(), "sender: forward: session destroyed");
                return Ok(());
            }

            // Is session connected
            let session = session.as_ref().unwrap().lock().unwrap();
            if session.receiver.is_none() {
                s.emit("error", "no receiver")?;
                warn!(
                    id = s.id.as_str(),
                    "sender: forward: session has no receiver"
                );
                return Ok(());
            }

            // Forward data to receiver
            let receiver = session.receiver.as_ref().unwrap();
            receiver.emit("message", &data)?;

            // Print log
            debug!(data = ?data, "sender: forward: data");
            info!(
                from = s.id.as_str(),
                to = receiver.id.as_str(),
                "sender: forward: ok"
            );

            // Success
            Ok(())
        };

        if let Err(err) = wrapper() {
            error!(id = tmp_s.id.as_str(), err = ?err, "sender: unexpected error");
            tmp_s.emit("error", &err.to_string()).ok();
        }
    });

    // Clean session on disconnect
    let session_3 = Arc::clone(&session);
    s.on_disconnect(move |s: SocketRef| {
        let tmp_s = s.clone();
        let wrapper = move || -> Result<()> {
            // Destroy session
            let session = session_3.lock().unwrap();
            if let Some(session) = session.as_ref() {
                if let Some(session) = session.upgrade() {
                    let session = session.lock().unwrap();
                    if let Some(receiver) = &session.receiver {
                        receiver.emit("destroyed", &Value::Null)?;
                    }
                    session.destroy();
                }
            }

            // Print log
            info!(id = s.id.as_str(), "sender: disconnected");

            // Success
            Ok(())
        };

        if let Err(err) = wrapper() {
            error!(id = tmp_s.id.as_str(), err = ?err, "sender: unexpected error");
            tmp_s.emit("error", &err.to_string()).ok();
        }
    });
}

pub fn receiver(s: SocketRef) {
    info!(id = s.id.as_str(), "receiver: connected");

    // Shared session
    let active = Arc::new(Mutex::new(false));
    let session = Arc::new(Mutex::new(None));

    // Find session
    let active_1 = Arc::clone(&active);
    let session_1 = Arc::clone(&session);
    s.on(
        "find",
        move |s: SocketRef, Data::<String>(data), ack: AckSender| {
            let tmp_s = s.clone();
            let wrapper = move || -> Result<()> {
                // Is active
                if *active_1.lock().unwrap() {
                    ack.send(&Value::Null)?;
                    s.emit("error", "active")?;
                    warn!(
                        id = s.id.as_str(),
                        code = data,
                        "receiver: find: session already active"
                    );
                    return Ok(());
                }

                // Is session found
                let tmp = Session::find(&data);
                if tmp.is_none() {
                    ack.send(&Value::Null)?;
                    s.emit("error", "not found")?;
                    warn!(
                        id = s.id.as_str(),
                        code = data,
                        "receiver: find: session not found"
                    );
                    return Ok(());
                }

                // Store candidate session
                {
                    let mut session = session_1.lock().unwrap();
                    *session = tmp.clone();
                }

                // Is session destroyed
                let tmp = tmp.unwrap().upgrade();
                if tmp.is_none() {
                    ack.send(&Value::Null)?;
                    s.emit("error", "destroyed")?;
                    warn!(
                        id = s.id.as_str(),
                        code = data,
                        "receiver: find: session destroyed"
                    );
                    return Ok(());
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
                }))?;

                // Print log
                debug!(session = ?tmp, "receiver: find: session");
                info!(id = s.id.as_str(), code = data, "receiver: find: ok");

                // Success
                Ok(())
            };

            if let Err(err) = wrapper() {
                error!(id = tmp_s.id.as_str(), err = ?err, "receriver: unexpected error");
                tmp_s.emit("error", &err.to_string()).ok();
            }
        },
    );

    // Connect session
    let active_2 = Arc::clone(&active);
    let session_2 = Arc::clone(&session);
    s.on("connect", move |s: SocketRef| {
        let tmp_s = s.clone();
        let wrapper = move || -> Result<()> {
            // Is active
            if *active_2.lock().unwrap() {
                s.emit("error", "active")?;
                warn!(
                    id = s.id.as_str(),
                    "receiver: connect: session already active"
                );
                return Ok(());
            }

            // Is session has candidate
            let session = session_2.lock().unwrap();
            if session.is_none() {
                s.emit("error", "no candidate")?;
                warn!(id = s.id.as_str(), "receiver: connect: no candidate found");
                return Ok(());
            }

            // Is session destroyed
            let session = session.as_ref().unwrap().upgrade();
            if session.is_none() {
                s.emit("error", "destroyed")?;
                warn!(id = s.id.as_str(), "receiver: connect: session destroyed");
                return Ok(());
            }

            // Is session available
            let session = session.unwrap();
            let mut session = session.lock().unwrap();
            if session.receiver.is_some() {
                s.emit("error", "not available")?;
                warn!(
                    id = s.id.as_str(),
                    "receiver: connect: session not available"
                );
                return Ok(());
            }

            // Update session
            *active_2.lock().unwrap() = true;
            session.receiver = Some(s.clone());

            // Emit events
            s.emit("connected", &Value::Null)?;
            session.sender.emit("connected", &Value::Null)?;

            // Print log
            info!(id = s.id.as_str(), "receiver: connect: ok");

            // Success
            Ok(())
        };

        if let Err(err) = wrapper() {
            error!(id = tmp_s.id.as_str(), err = ?err, "receriver: unexpected error");
            tmp_s.emit("error", &err.to_string()).ok();
        }
    });

    // Forward signal messages
    let active_3 = Arc::clone(&active);
    let session_3 = Arc::clone(&session);
    s.on("forward", move |s: SocketRef, Data::<Value>(data)| {
        let tmp_s = s.clone();
        let wrapper = move || -> Result<()> {
            // Is active
            if !*active_3.lock().unwrap() {
                s.emit("error", "not active")?;
                warn!(id = s.id.as_str(), "receiver: forward: session not active");
                return Ok(());
            }

            // Is session exists
            let session = session_3.lock().unwrap();
            if session.is_none() {
                s.emit("error", "not exists")?;
                warn!(id = s.id.as_str(), "receiver: forward: session not exists");
                return Ok(());
            }

            // Is session destroyed
            let session = session.as_ref().unwrap().upgrade();
            if session.is_none() {
                s.emit("error", "destroyed")?;
                warn!(id = s.id.as_str(), "receiver: forward: session destroyed");
                return Ok(());
            }

            // Forward data to sender
            let session = session.as_ref().unwrap().lock().unwrap();
            session.sender.emit("message", &data)?;

            // Print log
            debug!(data = ?data, "receiver: forward: data");
            info!(
                from = s.id.as_str(),
                to = session.sender.id.as_str(),
                "receiver: forward: ok"
            );

            // Success
            Ok(())
        };

        if let Err(err) = wrapper() {
            error!(id = tmp_s.id.as_str(), err = ?err, "receriver: unexpected error");
            tmp_s.emit("error", &err.to_string()).ok();
        }
    });

    // Clean session on disconnect
    let active_4 = Arc::clone(&active);
    let session_4 = Arc::clone(&session);
    s.on_disconnect(move |s: SocketRef| {
        let tmp_s = s.clone();
        let wrapper = move || -> Result<()> {
            // Destroy session
            if *active_4.lock().unwrap() {
                let session = session_4.lock().unwrap();
                if let Some(session) = session.as_ref() {
                    if let Some(session) = session.upgrade() {
                        let session = session.lock().unwrap();
                        session.sender.emit("destroyed", &Value::Null)?;
                        session.destroy();
                    }
                }
            }

            // Print log
            info!(id = s.id.as_str(), "receiver: disconnected");

            // Success
            Ok(())
        };

        if let Err(err) = wrapper() {
            error!(id = tmp_s.id.as_str(), err = ?err, "receriver: unexpected error");
            tmp_s.emit("error", &err.to_string()).ok();
        }
    });
}
