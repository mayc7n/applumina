import { forwardRef, type ReactNode } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";

import { useTemaApp } from "@/theme/theme";

interface FormFieldProps extends TextInputProps {
  rotulo: string;
  erro?: string;
  inicio?: ReactNode;
  fim?: ReactNode;
}

export const FormField = forwardRef<TextInput, FormFieldProps>(
  function FormField(
    { rotulo, erro, inicio, fim, style, ...props },
    referencia,
  ) {
    const tema = useTemaApp();
    return (
      <View style={styles.wrapper}>
        <Text style={[styles.label, { color: tema.cores.texto }]}>
          {rotulo}
        </Text>
        <View
          style={[
            styles.field,
            {
              backgroundColor: tema.cores.fundo,
              borderColor: erro ? tema.cores.perigo : tema.cores.borda,
            },
          ]}
        >
          {inicio}
          <TextInput
            ref={referencia}
            accessibilityLabel={rotulo}
            accessibilityHint={erro}
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
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 50,
    paddingHorizontal: 14,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: 12 },
  error: { fontSize: 12, lineHeight: 17 },
});
