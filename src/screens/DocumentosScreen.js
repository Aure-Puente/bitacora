import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, Divider, FAB, Text, useTheme } from 'react-native-paper';

import CollectionState from '../components/CollectionState';
import EmptyState from '../components/EmptyState';
import FileRow from '../components/FileRow';
import { useAuth } from '../context/AuthContext';
import { useTrip } from '../context/TripContext';
import useFiles from '../hooks/useFiles';
import { serif } from '../theme/fonts';
import { documentsOf } from '../utils/files';

export default function DocumentosScreen({ navigation }) {
  const theme = useTheme();
  const { user } = useAuth();
  const { currentTrip } = useTrip();
  const { files, loading, error } = useFiles(currentTrip.id, user.uid);

  const sections = useMemo(() => {
    const docs = documentsOf(files);
    return [
      { title: 'Solo vos', items: docs.filter((f) => f.visibility === 'private') },
      { title: 'Del grupo', items: docs.filter((f) => f.visibility === 'group' && f.kind === 'documento') },
      { title: 'Tickets de gastos', items: docs.filter((f) => f.kind === 'ticket') },
    ].filter((s) => s.items.length);
  }, [files]);

  const onAdd = () => navigation.navigate('SubirArchivo');

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content}>
        <CollectionState loading={loading} error={error}>
          {sections.length === 0 ? (
            <EmptyState
              icon="file-document-outline"
              title="Todavía no hay documentos"
              subtitle="Subí DNI, pasajes, vouchers y seguros. Elegís si los ve el grupo o solo vos."
              actionLabel="Subir documento"
              onAction={onAdd}
            />
          ) : (
            sections.map((s) => (
              <View key={s.title}>
                <Text variant="titleMedium" style={styles.title}>
                  {s.title}
                </Text>
                <Card>
                  {s.items.map((f, i) => (
                    <View key={f.id}>
                      {i > 0 ? <Divider /> : null}
                      <FileRow file={f} navigation={navigation} />
                    </View>
                  ))}
                </Card>
              </View>
            ))
          )}
        </CollectionState>
      </ScrollView>
      {sections.length > 0 ? (
        <FAB
          icon="plus"
          label="Documento"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          color={theme.colors.onPrimary}
          onPress={onAdd}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 100 },
  title: { marginTop: 8, marginBottom: 8, fontFamily: serif, fontWeight: 'bold' },
  fab: { position: 'absolute', right: 16, bottom: 16 },
});
