use std::env;

use axum::{
    extract::Request,
    http::StatusCode,
    middleware::Next,
    response::{IntoResponse, Response},
};
use axum_extra::{
    TypedHeader,
    headers::{Authorization, authorization::Bearer},
};

pub async fn auth_guard(
    auth: Option<TypedHeader<Authorization<Bearer>>>,
    req: Request,
    next: Next,
) -> Response {
    let auth_token = env::var("AUTH_TOKEN").ok();
    if auth_token.is_none() {
        return next.run(req).await;
    }

    if auth.is_none() || auth.unwrap().token() != auth_token.unwrap() {
        return (StatusCode::UNAUTHORIZED, "Unauthorized").into_response();
    }

    next.run(req).await
}
