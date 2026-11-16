/*
 * Campo password: bottone per mostrarla/nasconderla (sempre presente) e avviso
 * quando il blocco maiuscole è attivo, causa frequente di password "sbagliate".
 */
import { useState, type KeyboardEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { TextField, type TextFieldProps } from "@/components/form/TextField";

export function PasswordField(props: Omit<TextFieldProps, "type" | "trailing">) {
  const [visible, setVisible] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const label = visible ? "Nascondi password" : "Mostra password";
  const readCaps = (event: KeyboardEvent<HTMLInputElement>) => setCapsLock(event.getModifierState("CapsLock"));

  return (
    <TextField
      {...props}
      type={visible ? "text" : "password"}
      onKeyDown={readCaps}
      onKeyUp={readCaps}
      hint={capsLock ? "Blocco maiuscole attivo." : props.hint}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={label}
          title={label}
          aria-pressed={visible}
          className="-mr-1.5 flex size-7 shrink-0 items-center justify-center rounded-[7px] text-ink-3
            transition-colors duration-100 hover:bg-hover-2 hover:text-ink"
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      }
    />
  );
}
