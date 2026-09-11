import type { ComponentProps } from "react";
import { FilesDropzone } from "./FilesDropzone";

export type FilePickerProps = ComponentProps<typeof FilesDropzone>;

export function FilePicker(props: FilePickerProps) {
  return <FilesDropzone {...props} />;
}
