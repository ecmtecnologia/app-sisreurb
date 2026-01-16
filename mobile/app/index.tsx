import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { router } from 'expo-router';

interface Property {
  id: string;
  name: string;
  quadra: string;
  status: string;
}

// Mock data - será substituído por dados reais do SQLite
const mockProperties: Property[] = [
  { id: '1', name: 'Lote 195', quadra: 'Quadra 115', status: 'pending' },
  { id: '2', name: 'Lote 214', quadra: 'Quadra 115', status: 'pending' },
];

export default function HomeScreen() {
  const handleStartVistoria = (propertyId: string) => {
    router.push(`/vistoria/${propertyId}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Loteamentos Pendentes</Text>
        <Text style={styles.subtitle}>Total: {mockProperties.length}</Text>
      </View>

      <FlatList
        data={mockProperties}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardSubtitle}>{item.quadra}</Text>
              <Text style={[styles.cardStatus, styles.statusPending]}>
                ⏳ Pendente
              </Text>
            </View>
            <TouchableOpacity
              style={styles.button}
              onPress={() => handleStartVistoria(item.id)}
            >
              <Text style={styles.buttonText}>Iniciar</Text>
            </TouchableOpacity>
          </View>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>🟢 Online</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1a73e8',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#e0e0e0',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  cardStatus: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: '500',
  },
  statusPending: {
    color: '#f57c00',
  },
  button: {
    backgroundColor: '#1a73e8',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  footer: {
    backgroundColor: '#4caf50',
    padding: 12,
    alignItems: 'center',
  },
  footerText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
  },
});
