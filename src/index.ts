export { FormSwitch } from './FormSwitch'
export type { FormSwitchProps } from './FormSwitch'

export { registerField, getField, hasField } from './registry/fields'
export { registerSerializer, serialize } from './registry/serializers'
export type { Serializer } from './registry/serializers'

export { registerLoader, getLoader, Loader } from './registry/loaders'
export type { LoaderComponent } from './registry/loaders'

export { defineTheme, themes, light, dark } from './theme/themes'
export type { ThemeInput } from './theme/themes'

export type {
  FormSchema,
  FieldSpec,
  FieldRules,
  StepSpec,
  FieldProps,
  FieldComponent,
  ColSpan,
  Option,
  PayloadFormat,
  ThemeTokens,
  Values,
  UIConfig,
  UITheme,
  UIButton,
  UIToast,
  FieldSize,
  LabelPosition,
  ButtonPosition,
  ErrorDisplay,
  ToastPosition,
} from './schema/types'
