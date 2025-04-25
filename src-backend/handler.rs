use socketioxide::extract::SocketRef;

pub fn sender(s: SocketRef) {
    s.on("new", || {});
    s.on("forward", || {});

    todo!();
}

pub fn receiver(s: SocketRef) {
    s.on("new", || {});
    s.on("forward", || {});

    todo!();
}
