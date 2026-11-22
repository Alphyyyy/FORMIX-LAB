import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import type { AppData, StaffSession } from '../domain/types';
import { FormixProvider } from '../state/FormixProvider';

export interface RenderFormixOptions {
  data?: AppData;
  currentSessionId?: string | null;
  staff?: StaffSession | null;
}

export function renderWithFormix(ui: ReactElement, options: RenderFormixOptions = {}) {
  return render(
    <FormixProvider
      initialData={options.data}
      initialCurrentSessionId={options.currentSessionId}
      initialStaff={options.staff}
    >
      {ui}
    </FormixProvider>,
  );
}
