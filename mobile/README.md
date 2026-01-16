# 📱 App Mobile REURB - React Native

Sistema de captura de dados de vistoria (inspeção) de propriedades REURB com suporte offline-first.

## 🎯 Funcionalidades Principais

### 1. **📍 Captura GPS com Validação de Acurácia**
- Localização com precisão de até 15 metros
- Validação em tempo real
- Suporte offline com cache local
- Fallback para GPS do dispositivo

### 2. **📷 Captura Sequencial de 3 Fotos**
- Interface intuitiva com câmera em tempo real
- Armazenamento local no filesystem
- Preview das fotos capturadas
- Remoção individual de fotos

### 3. **✍️ Assinatura Digital com Auto-Save**
- Dois campos de assinatura (Vistoriador + Requerente)
- Conversão automática para Base64
- Auto-save em cada etapa
- Recuperação em caso de crash

### 4. **🔄 Sincronização Offline-First**
- Detecta status online/offline automaticamente
- Fila de vistorias pendentes
- Upload de fotos e assinaturas para Supabase
- Retry automático em caso de falha

## 📋 Requisitos

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- iOS 13.4+ ou Android 6.0+
- Supabase project (para sincronização)

## 🚀 Instalação

```bash
cd mobile
npm install
```

## ⚙️ Configuração

Criar arquivo `.env` na raiz do projeto mobile:

```env
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
```

## 🏃 Executar

```bash
# Desenvolvimento com Expo Go
npm start

# iOS
npm run ios

# Android
npm run android

# Build para distribuição
npm run build
```

## 📁 Estrutura do Projeto

```
mobile/
├── src/
│   ├── screens/
│   │   └── Vistoria/
│   │       ├── VistoriaScreen.tsx      # Tela principal de vistoria
│   │       └── index.ts
│   ├── components/
│   │   ├── GPS/
│   │   │   └── GPSLocationCapture.tsx  # Captura de localização
│   │   ├── Camera/
│   │   │   └── MultiPhotoCamera.tsx    # Captura de 3 fotos
│   │   └── Signature/
│   │       └── SignatureCapture.tsx    # Assinatura digital
│   ├── services/
│   │   ├── database/
│   │   │   └── surveyService.ts        # SQLite operations
│   │   └── sync/
│   │       └── syncService.ts          # Supabase sync
│   ├── hooks/
│   ├── utils/
│   ├── types/
│   └── assets/images/
├── app/
│   ├── _layout.tsx                     # Navegação raiz
│   ├── index.tsx                       # Tela inicial
│   └── vistoria/
│       ├── _layout.tsx
│       └── [propertyId].tsx
├── package.json
├── tsconfig.json
└── README.md
```

## 🔑 Componentes Principais

### GPSLocationCapture
```typescript
<GPSLocationCapture 
  onLocationCaptured={(coords) => {
    // coords: { latitude, longitude, accuracy, timestamp }
  }}
  minAccuracy={15}  // metros
/>
```

### MultiPhotoCamera
```typescript
<MultiPhotoCamera
  onPhotosCaptured={(photos) => {
    // photos: { uri, timestamp, order }[]
  }}
  maxPhotos={3}
/>
```

### SignatureCapture
```typescript
<SignatureCapture
  onSignaturesCaptured={(data) => {
    // data: { vistoriador, requerente, timestamp }
    // vistoriador/requerente em Base64
  }}
  onAutoSave={(data) => {
    // Auto-save em cada assinatura
  }}
/>
```

## 📊 Fluxo de Vistoria

1. **Captura de Localização** (GPS com validação < 15m)
2. **Captura de Fotos** (3 consecutivas do lote)
3. **Captura de Assinaturas** (Vistoriador + Requerente)
4. **Revisão** (Validação dos dados)
5. **Sincronização** (Offline → Supabase Storage)

## 💾 Banco de Dados Local

SQLite com tabela `reurb_surveys`:
- `id`: Identificador único
- `property_id`: Referência ao lote
- `latitude/longitude`: Coordenadas GPS
- `accuracy`: Precisão do GPS
- `photos`: Array JSON de URIs
- `vistoriador_signature`: Base64
- `requerente_signature`: Base64
- `status`: 'draft' | 'pending_sync' | 'synced'
- `created_at`: Timestamp
- `synced_at`: Timestamp de sincronização

## 🔒 Segurança

- Permissões de câmera e localização solicitadas dinamicamente
- Validação de acurácia GPS obrigatória
- Assinaturas salvam automaticamente (3 pontos de salvamento)
- Dados sensíveis não são compartilhados em logs
- HTTPS only para sincronização

## 🐛 Debugging

### Logs da Câmera
```typescript
import { Camera } from 'expo-camera';
Camera.requestCameraPermissionsAsync().then(status => {
  console.log('Camera status:', status);
});
```

### Logs do GPS
```typescript
import * as Location from 'expo-location';
Location.getCurrentPositionAsync().then(loc => {
  console.log('GPS accuracy:', loc.coords.accuracy);
});
```

### Logs da Sync
```typescript
syncService.syncPendingSurveys().then(result => {
  console.log('Sync result:', result);
});
```

## 📱 Plataformas Suportadas

- ✅ iOS (Expo Go + build)
- ✅ Android (Expo Go + build)
- ❌ Web (não suportado para câmera/GPS)

## 🔄 Atualizações

```bash
# Atualizar dependências
npm update

# Verificar versão do Expo
npx expo --version

# Limpar cache
npx expo start --clear
```

## 📝 Licença

Proprietary - SISREURB 2024
