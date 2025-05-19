export interface Option {
  label: string;
  value: string;
}

export interface CustomDropdownProps {
  options: Option[];
  selected: string;
  onSelect: (value: string) => void;
}
