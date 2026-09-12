import type { FileValidationOptions, FileValidationResult } from "./types";

export function validateFile(
  file: Pick<File, "name" | "type" | "size">,
  options: FileValidationOptions = {},
): FileValidationResult {
  const acceptedTypes = options.acceptedTypes ?? [];
  if (acceptedTypes.length > 0) {
    const accepted = acceptedTypes.some((type) =>
      type.endsWith("/*")
        ? file.type.startsWith(type.slice(0, -1))
        : type.toLowerCase() === file.type.toLowerCase(),
    );
    if (!accepted) return { valid: false, error: `${file.name} is not an accepted file type.` };
  }
  if (options.maxSizeBytes != null && file.size > options.maxSizeBytes) {
    return { valid: false, error: `${file.name} exceeds the maximum file size.` };
  }
  return { valid: true };
}

export function validateFiles(
  files: readonly Pick<File, "name" | "type" | "size">[],
  options: FileValidationOptions = {},
): FileValidationResult[] {
  return files.map((file) => validateFile(file, options));
}
