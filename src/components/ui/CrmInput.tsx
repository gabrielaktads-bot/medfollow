import { cn } from "@/lib/utils";
import { maskCRM } from "@/lib/masks";

interface CrmInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const CrmInput = ({ value, onChange, className }: CrmInputProps) => {
  const suffix = value.replace(/^CRM\//, "");
  return (
    <div className={cn(
      "flex h-10 rounded-md border border-input bg-background text-sm ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
      className
    )}>
      <span className="flex items-center px-3 text-muted-foreground bg-muted border-r rounded-l-md select-none">
        CRM/
      </span>
      <input
        className="flex-1 min-w-0 px-3 bg-transparent outline-none placeholder:text-muted-foreground"
        value={suffix}
        onChange={(e) => onChange(maskCRM("CRM/" + e.target.value))}
        placeholder="UF 000000"
        maxLength={9}
      />
    </div>
  );
};

export default CrmInput;
