# 🚀 Quick Start - Smart Honey

## Testar Agora (3 passos)

### 1. Instalar Expo Go no celular

- **Android:** [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
- **iOS:** [App Store](https://apps.apple.com/app/expo-go/id982107779)

### 2. Iniciar o servidor

```bash
cd /home/uaimax/projects/smart-honey-app
npm start
```

### 3. Escanear QR Code

- **Android:** Abrir Expo Go e escanear o QR code do terminal
- **iOS:** Abrir Câmera nativa e escanear o QR code

## Testando Funcionalidades

### Gravação de Áudio
1. Segure o botão 🎙️
2. Fale: "R$22,50 picolés no C6 da Bruna"
3. Solte o botão
4. Veja o feedback inline

### Lançamento Manual
1. Digite no campo: "ifood 18,90 max"
2. Veja as sugestões aparecerem
3. Toque em "Salvar Lançamento"

### Modo Offline
1. Ative modo avião
2. Faça um lançamento
3. Veja "Aguardando conexão..."
4. Desative modo avião
5. App sincroniza automaticamente

## Estrutura de Pastas

```
src/
├── components/      # Componentes reutilizáveis
│   ├── DraftItem.tsx
│   ├── RecordButton.tsx
│   └── SmartInput.tsx
├── context/         # Estado global
│   └── AppContext.tsx
├── hooks/           # Hooks customizados
│   ├── useAudioRecorder.ts
│   └── useDrafts.ts
├── navigation/      # Navegação
│   └── AppNavigator.tsx
├── screens/         # Telas
│   ├── HomeScreen.tsx
│   ├── HistoryScreen.tsx
│   ├── QueueScreen.tsx
│   └── PreferencesScreen.tsx
├── services/        # Lógica de negócio
│   ├── api.ts
│   ├── queue.ts
│   └── notifications.ts
├── theme/           # Design system
│   ├── colors.ts
│   ├── spacing.ts
│   ├── typography.ts
│   └── index.ts
├── types/           # TypeScript types
│   └── index.ts
└── utils/           # Utilitários
    └── parsers.ts
```

## Comandos Úteis

```bash
# Desenvolvimento
npm start              # Expo Go
npm run android        # Android emulator/device
npm run ios            # iOS (apenas macOS)

# Limpar cache
npx expo start --clear

# Build APK (requer EAS)
npm run build:apk
```

## Próximos Passos

1. **Testar no celular** com Expo Go
2. **Ajustar se necessário** baseado no feedback
3. **Build APK** quando estiver satisfeito
4. **Integrar API real** quando backend estiver pronto

## Troubleshooting

### QR Code não funciona
- Certifique-se de estar na mesma rede Wi-Fi
- Tente modo Tunnel: `npx expo start --tunnel`

### Erro de permissão de áudio
- Verifique se permitiu acesso ao microfone quando solicitado
- Vá em Configurações > Apps > Expo Go > Permissões

### App não carrega
- Limpe cache: `npx expo start --clear`
- Reinstale dependências: `rm -rf node_modules && npm install`

## Dúvidas?

- Consulte `README.md` para detalhes completos
- Veja `Claude.md` para arquitetura detalhada
- Confira `.context/decisions.md` para decisões de design

