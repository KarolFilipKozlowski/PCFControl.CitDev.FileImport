import * as React from "react";
import { useState, createRef } from "react";
import { Caption1, Button, CompoundButton, Spinner, FluentProvider, Theme, webLightTheme,} from "@fluentui/react-components";
import { AttachRegular, AttachFilled, CheckmarkFilled } from "@fluentui/react-icons";
import { iconRegularMapping, iconFilledMapping } from "./iconsMapping";
import { ButtonLoadingStateEnum } from "./utils";
import { getButtonAppearance, getButtonIconPosition, getButtonShape, getButtonSize, getButtonStyle, getDisplayMode,} from "./utils";

export interface IFilesImportControlProps {
  buttonText: string;
  buttonIcon: string;
  buttonIconStyle: string;
  buttonAppearance: string;
  buttonAlign: string;
  buttonVisible: boolean;
  buttonFontWeight: string;
  buttonDisplayMode: string;
  buttonWidth: number;
  buttonHeight: number;
  buttonShowSecondaryContent: boolean;
  buttonSecondaryContent: string;
  buttonShowActionSpinner: boolean;
  buttonIconPosition: string;
  buttonShape: string;
  buttonButtonSize: string;
  buttonDisabledFocusable: boolean;
  buttonAllowMultipleFiles: boolean;
  buttonAllowedFileTypes: string;
  buttonAllowDropFiles: boolean;
  buttonAllowDropFilesText: string;
  canvasAppCurrentTheme: Theme;
  onEvent: (event: any) => void;
}

export const FilesImportControl: React.FC<IFilesImportControlProps> = ({
  buttonText,
  buttonIcon,
  buttonIconStyle,
  buttonAppearance,
  buttonAlign,
  buttonVisible,
  buttonFontWeight,
  buttonDisplayMode,
  buttonWidth,
  buttonHeight,
  buttonShowSecondaryContent,
  buttonSecondaryContent,
  buttonShowActionSpinner,
  buttonIconPosition,
  buttonShape,
  buttonButtonSize,
  buttonDisabledFocusable,
  buttonAllowMultipleFiles,
  buttonAllowedFileTypes,
  buttonAllowDropFiles,
  buttonAllowDropFilesText,
  canvasAppCurrentTheme,
  onEvent
}) => {
  
  // THEME
  // Use the provided theme if available; otherwise, fall back to the default webLightTheme.
  const _theme = canvasAppCurrentTheme?.fontFamilyBase?.trim()
    ? canvasAppCurrentTheme
    : webLightTheme;

  // BUTTON
  // Maintain the loading state for the button and define a function to determine which icon to display.
  const [buttonLoadingState, setButtonLoadingState] = useState<ButtonLoadingStateEnum>(
    ButtonLoadingStateEnum.Initial
  );

  const getButtonIcon = () => {
    if (buttonLoadingState === "loading") return <Spinner size="tiny" />;
    if (buttonLoadingState === "loaded") return <CheckmarkFilled />;
    return buttonIconStyle === "1"
      ? iconFilledMapping[buttonIcon] || <AttachFilled />
      : iconRegularMapping[buttonIcon] || <AttachRegular />;
  };

  // Prepare common button props using helper functions.
  const _buttonProps = {
    icon: getButtonIcon(),
    disabledFocusable: buttonDisabledFocusable,
    appearance: getButtonAppearance(buttonAppearance),
    iconPosition: getButtonIconPosition(buttonIconPosition),
    shape: getButtonShape(buttonShape),
    size: getButtonSize(buttonButtonSize),
    style: getButtonStyle(buttonWidth, buttonHeight, buttonAlign, buttonFontWeight),
    disabled: getDisplayMode(buttonLoadingState, buttonDisplayMode),
  };

  // FILES
  // Create a reference for the hidden file input.
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const importFileRef = createRef<HTMLInputElement>();

  // readFile: Reads a file using FileReader and returns its result as a data URL.
  const readFile = (file: File): Promise<string | null> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      // Handle file reading errors.
      reader.onerror = () => {
        console.error(`Error reading file: ${file.name}`);
        reject(null);
      };

      // When reading is finished, resolve the promise with the result.
      reader.onload = () => {
        resolve(reader.result as string);
      };

      reader.readAsDataURL(file);
    });
  };

  // processFiles: Processes a list of files by reading their contents and preparing a JSON object.
  const processFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    try {
      if (buttonShowActionSpinner) {
        setButtonLoadingState(ButtonLoadingStateEnum.Loading);
      }

      // Process each file and create an array of objects with file name and content bytes.
      const filesArray = await Promise.all(
        Array.from(files).map(async (file) => {
          const fileContent = await readFile(file);

          return {
            name: file.name,
            size: file.size,
            contentBytes: fileContent || "",
          };
        })
      );

      // Convert the array into a JSON string.
      setSelectedFiles(Array.from(files));
      const jsonString = JSON.stringify(filesArray);
      
      // Trigger the onEvent callback with the processed files JSON.
      onEvent({ filesJSON: jsonString });

      // Set button state to "loaded" if action spinner is enabled.
      if (buttonShowActionSpinner) {
        setButtonLoadingState(ButtonLoadingStateEnum.Loaded);
      }
    } catch (error) {
      console.error("Error processing files:", error)
      setButtonLoadingState(ButtonLoadingStateEnum.Initial);
    }
  };

  // onFileChange: Event handler for when a file is selected using the file input.
  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      await processFiles(event.target.files);
      event.target.value = "";
    }
  };

  // handleButtonClick: Resets the button loading state and triggers the hidden file input click.
  const handleButtonClick = () => {
    setButtonLoadingState(ButtonLoadingStateEnum.Initial);
    importFileRef.current?.click();
  };

  // DRAG & DROP HANDLING
  // Maintain a state for whether a file is being dragged over the control.
  const [isDragging, setIsDragging] = React.useState<boolean>(false);
  const dropZoneRef = React.useRef<HTMLDivElement>(null);

  // onDragEnter: Triggered when a dragged item enters the drop zone.
  const onDragEnter = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  // onDragOver: Triggered continuously while a dragged item is over the drop zone.
  const onDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  };

  // onDragLeave: Triggered when a dragged item leaves the drop zone.
  const onDragLeave = (event: React.DragEvent) => {
    if (!dropZoneRef.current?.contains(event.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  // onDrop: Triggered when a file is dropped onto the control.
  const onDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);

    if (event.dataTransfer.files) {
      await processFiles(event.dataTransfer.files);
    }
  };

  return (
    <div
      ref={dropZoneRef}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      style={{
        border: (isDragging && buttonAllowDropFiles) ? `1px dashed ${_theme.colorBrandBackground}` : "0px none transparent",
        padding: (isDragging && buttonAllowDropFiles) ? `10px` : "0px",
        borderRadius: (isDragging && buttonAllowDropFiles) ? `5px` : "0px",
        height: (isDragging && buttonAllowDropFiles) ? buttonHeight + 10 : buttonHeight,
        width:(isDragging && buttonAllowDropFiles) ? buttonWidth + 10 : buttonWidth,
        textAlign: "center",  
        transition: "border 1s ease-in-out",
        backgroundColor: (isDragging && buttonAllowDropFiles)   ? `${_theme.colorBrandBackground2}25` : "transparent", 
        backdropFilter: (isDragging && buttonAllowDropFiles) ? "blur(10px)" : "none", 
      }}
    >
      {buttonVisible ? (
        <FluentProvider theme={_theme}>
          {buttonShowSecondaryContent ? (
            <CompoundButton onClick={handleButtonClick} {..._buttonProps} secondaryContent={buttonSecondaryContent}>
              {buttonText}
            </CompoundButton>
          ) : (
            <Button onClick={handleButtonClick} {..._buttonProps}>
              {buttonText}
            </Button>
          )}
        </FluentProvider>
      ) : null}
      {/* Hidden file input for file selection */}
      <input
        ref={importFileRef}
        multiple={buttonAllowMultipleFiles}
        type="file"
        accept={buttonAllowedFileTypes}
        onChange={onFileChange}
        style={{ display: "none" }}
      />
      {/* Show drag-and-drop text when dragging files over and drag/drop is allowed */}
      {(isDragging && buttonAllowDropFiles) && <Caption1>{buttonAllowDropFilesText}</Caption1>}
    </div>
  );
};
