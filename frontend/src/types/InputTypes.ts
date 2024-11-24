export interface BaseInputProps<T> {
  // Core props
  value: T | undefined;
  onChange: (value: T | undefined) => void;
  name: string;
  
  // Display and labeling
  label?: string;
  title?: string;  // Section title above the input
  titleVariant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'subtitle1' | 'subtitle2';
  hideTitle?: boolean;
  
  // Validation and state
  error?: string;
  required?: boolean;
  disabled?: boolean;
  
  // Metadata and help
  description?: string;
  placeholder?: string;
  
  // Styling and layout
  className?: string;
  fullWidth?: boolean;
}

export interface TextInputProps extends BaseInputProps<string> {
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
  minLength?: number;
}

export interface NumericInputProps extends BaseInputProps<number> {
  min?: number;
  max?: number;
  step?: number;
  isInteger?: boolean;
}

export interface BooleanInputProps extends BaseInputProps<boolean> {
  labelPlacement?: 'start' | 'end' | 'top' | 'bottom';
  displayAsSwitch?: boolean;
}

export interface SelectionOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface SelectInputProps extends BaseInputProps<string | string[]> {
  options: SelectionOption[];
  multiple?: boolean;
  clearable?: boolean;
  searchable?: boolean;
  maxItems?: number;
}

export interface SelectionOptionWithIcon extends SelectionOption {
  icon?: React.ReactNode;
}

export interface IconSelectInputProps extends SelectInputProps {
  options: SelectionOptionWithIcon[];
  showSelectedIcon?: boolean;  // Whether to show icon in the selected value
  chipDisplay?: boolean;  // Whether to display selected values as chips
  renderOption?: (option: SelectionOptionWithIcon) => React.ReactNode;  // Custom option rendering
}