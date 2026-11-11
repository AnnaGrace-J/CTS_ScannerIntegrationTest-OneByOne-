import type { ReactNode } from "react";
import { FormPanel } from "./operations";

type FormSectionProps = {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function FormSection({ title, actions, children }: FormSectionProps) {
  return (
    <FormPanel actions={actions} title={title}>
      {children}
    </FormPanel>
  );
}
