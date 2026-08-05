use std::{
    env,
    fs::{self, File},
    io::Read,
    path::{Path, PathBuf},
};

use serde::Serialize;
use tauri::Manager;

const SPLATS_FILE_NAME: &str = "splats.spz";
const COLLIDERS_FILE_NAME: &str = "colliders.glb";

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct SceneAssetPaths {
    splats: String,
    colliders: String,
}

fn scene_directory() -> Result<PathBuf, String> {
    if let Some(directory) = env::var_os("OMNIPRAXIS_SCENE_DIR") {
        return Ok(PathBuf::from(directory));
    }

    if cfg!(debug_assertions) {
        return Ok(Path::new(env!("CARGO_MANIFEST_DIR")).join("../public/scenes/base"));
    }

    env::current_exe()
        .map_err(|error| format!("Could not locate the application executable: {error}"))?
        .parent()
        .map(Path::to_path_buf)
        .ok_or_else(|| "Could not locate the directory containing the application.".to_owned())
}

fn read_header(path: &Path, length: usize) -> Result<(fs::Metadata, Vec<u8>), String> {
    let metadata = fs::metadata(path)
        .map_err(|error| format!("Could not read {}: {error}", path.display()))?;

    if !metadata.is_file() {
        return Err(format!("{} is not a file.", path.display()));
    }

    if metadata.len() < length as u64 {
        return Err(format!("{} is empty or incomplete.", path.display()));
    }

    let mut header = vec![0; length];
    let mut file =
        File::open(path).map_err(|error| format!("Could not open {}: {error}", path.display()))?;

    file.read_exact(&mut header)
        .map_err(|error| format!("Could not inspect {}: {error}", path.display()))?;

    Ok((metadata, header))
}

fn validate_splats(path: &Path) -> Result<(), String> {
    let (_, header) = read_header(path, 2)?;

    if header != [0x1f, 0x8b] {
        return Err(format!(
            "{} is not a valid gzip-compressed SPZ file.",
            path.display()
        ));
    }

    Ok(())
}

fn validate_colliders(path: &Path) -> Result<(), String> {
    let (metadata, header) = read_header(path, 12)?;

    if &header[0..4] != b"glTF" {
        return Err(format!("{} is not a binary GLB file.", path.display()));
    }

    let version = u32::from_le_bytes(header[4..8].try_into().expect("four-byte GLB version"));
    let declared_length =
        u32::from_le_bytes(header[8..12].try_into().expect("four-byte GLB length"));

    if version != 2 {
        return Err(format!(
            "{} uses unsupported GLB version {version}; version 2 is required.",
            path.display()
        ));
    }

    if u64::from(declared_length) != metadata.len() {
        return Err(format!(
            "{} is incomplete: its GLB header declares {declared_length} bytes but the file contains {}.",
            path.display(),
            metadata.len()
        ));
    }

    Ok(())
}

#[tauri::command]
fn resolve_scene_assets(app: tauri::AppHandle) -> Result<SceneAssetPaths, String> {
    let directory = scene_directory()?;
    let splats = directory.join(SPLATS_FILE_NAME);
    let colliders = directory.join(COLLIDERS_FILE_NAME);

    validate_splats(&splats)?;
    validate_colliders(&colliders)?;

    let scope = app.asset_protocol_scope();

    scope
        .allow_file(&splats)
        .map_err(|error| format!("Could not expose {}: {error}", splats.display()))?;
    scope
        .allow_file(&colliders)
        .map_err(|error| format!("Could not expose {}: {error}", colliders.display()))?;

    Ok(SceneAssetPaths {
        splats: splats.to_string_lossy().into_owned(),
        colliders: colliders.to_string_lossy().into_owned(),
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![resolve_scene_assets])
        .run(tauri::generate_context!())
        .expect("error while running Omnipraxis");
}
