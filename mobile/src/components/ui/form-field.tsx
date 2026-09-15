import { forwardRef, type ReactNode, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";

import { useTemaApp } from "@/theme/theme";

interface FormFieldProps extends TextInputProps {
  rotulo: string;
  erro?: string;
  inicio?: ReactNode;
  fim?: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

export const FormField = forwardRef<TextInput, FormFieldProps>(
  function FormField(
    { rotulo, erro, inicio, fim, containerStyle, onBlur, onFocus, style, ...props },
    referencia,
  ) {
    const tema = useTemaApp();
    const [focado, definirFocado] = useState(false);
    return (
      <View style={[styles.wrapper, containerStyle]}>
        <Text style={[styles.label, { color: focado ? tema.cores.marca : tema.cores.texto }]}>
          {rotulo}
        </Text>
        <View
          style={[
            styles.field,
            {
              backgroundColor: tema.cores.fundo,
              borderColor: erro
                ? tema.cores.perigo
                : focado
                  ? tema.cores.marca
                  : tema.cores.borda,
              borderWidth: focado || erro ? 2 : 1,
            },
          ]}
        >
          {inicio}
          <TextInput
            ref={referencia}
            accessibilityLabel={rotulo}
            accessibilityHint={erro}
            onBlur={(evento) => {
              definirFocado(false);
              onBlur?.(evento);
            }}
            onFocus={(evento) => {
              definirFocado(true);
              onFocus?.(evento);
            }}
            placeholderTextColor={tema.cores.textoSutil}
            selectionColor={tema.cores.marca}
            style={[styles.input, { color: tema.cores.texto }, style]}
            {...props}
          />
          {fim}
        </View>
        {erro ? (
          <Text
            accessibilityLiveRegion="polite"
            style={[styles.error, { color: tema.cores.perigo }]}
          >
            {erro}
          </Text>
        ) : null}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  wrapper: { gap: 7 },
  label: { fontSize: 14, fontWeight: "600" },
  field: {
    alignItems: "center",
    borderRadius: 12,
    flexDirection: "row",
    minHeight: 50,
    paddingHorizontal: 14,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: 12 },
  error: { fontSize: 12, lineHeight: 17 },
});
