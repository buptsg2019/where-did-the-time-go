// Utils module
// 工具函数

pub mod error;

pub use error::{AppError, AppResult};

// Re-export for use in other modules
#[allow(unused_imports)]
pub use error::AppResult as _AppResult;
