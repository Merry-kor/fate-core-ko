import React from 'react';

export interface TabItem {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  count?: number;
}

export interface TabsProps {
  items: TabItem[];
  /** Controlled active id. */
  value?: string;
  /** Uncontrolled initial id. */
  defaultValue?: string;
  onChange?: (id: string) => void;
}

/**
 * Underline tab bar for actor-sheet navigation.
 */
export function Tabs(props: TabsProps): JSX.Element;
