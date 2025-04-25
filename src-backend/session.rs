use std::{
    collections::HashMap,
    sync::{Arc, Mutex, OnceLock, Weak},
};

use rand::TryRngCore;
use socketioxide::extract::SocketRef;

pub struct Session {
    pub code: String,
    pub file_name: String,
    pub file_mime: String,
    pub file_size: u64,
    pub sender: SocketRef,
    pub receiver: Option<SocketRef>,
}
impl Session {
    fn gen_code() -> String {
        const CHARSET: &[u8] = b"6789BCDFGHJKLMNPQRTWbcdfghjkmnpqrtwz";
        const LENGTH: usize = 6;

        let mut rng = rand::rngs::OsRng;
        (0..LENGTH)
            .map(|_| {
                let idx = rng.try_next_u32().unwrap() as usize % CHARSET.len();
                CHARSET[idx] as char
            })
            .collect()
    }

    fn get_session_map() -> &'static Mutex<HashMap<String, Arc<Mutex<Session>>>> {
        static INSTANCE: OnceLock<Mutex<HashMap<String, Arc<Mutex<Session>>>>> = OnceLock::new();
        INSTANCE.get_or_init(|| Mutex::new(HashMap::new()))
    }

    pub fn new(
        file_name: String,
        file_mime: String,
        file_size: u64,
        sender: SocketRef,
    ) -> Weak<Mutex<Session>> {
        let mut map = Self::get_session_map().lock().unwrap();
        let code = loop {
            let code = Self::gen_code();
            if !map.contains_key(&code) {
                break code;
            }
        };

        let s = Self {
            code: code.clone(),
            file_name,
            file_mime,
            file_size,
            sender,
            receiver: None,
        };
        let s = Arc::new(Mutex::new(s));
        map.insert(code, Arc::clone(&s));

        Arc::downgrade(&s)
    }

    pub fn find(code: &String) -> Option<Weak<Mutex<Session>>> {
        let map = Self::get_session_map().lock().unwrap();
        map.get(code).map(|v| Arc::downgrade(v))
    }

    pub fn destroy(&self) {
        let mut map = Self::get_session_map().lock().unwrap();
        map.remove(&self.code);
    }
}
