# Gravação de Áudio Estilo WhatsApp

## Visão Geral

O componente `WhatsAppAudioRecorder` oferece uma interface de gravação de áudio intuitiva e moderna, inspirada no WhatsApp, com suporte a gestos e controles avançados.

## Recursos

### ✨ Gestos Intuitivos

1. **Segurar para Gravar**
   - Pressione e segure o botão do microfone para iniciar a gravação
   - A gravação continua enquanto o dedo estiver pressionado

2. **Deslizar para Cima = Travar Gravação** 🔒
   - Durante a gravação, deslize o dedo para cima
   - A gravação fica "travada" e você pode soltar o dedo
   - Libera as mãos para continuar gravando sem segurar

3. **Deslizar para Esquerda = Cancelar** ❌
   - Durante a gravação, deslize o dedo para a esquerda
   - A gravação é cancelada e descartada
   - Feedback visual indica quando você pode soltar para cancelar

4. **Soltar = Enviar** ✅
   - Se não deslizar, simplesmente solte o dedo para enviar
   - A gravação é finalizada e enviada automaticamente

### 🎛️ Controles (Modo Travado)

Quando a gravação está travada, você tem acesso a três controles:

1. **Pausar/Retomar** ⏸️▶️
   - Pause a gravação temporariamente
   - Retome quando quiser continuar
   - O timer pausa junto

2. **Excluir** 🗑️
   - Descarta a gravação completamente
   - Volta ao estado inicial

3. **Enviar** 📤
   - Finaliza e envia a gravação
   - Processa e submete o áudio

### 🎨 Feedback Visual

- **Timer**: Mostra duração da gravação em tempo real
- **Indicador de gravação**: Ponto vermelho pulsante
- **Hints visuais**: Aparecem durante os gestos
  - "Deslize para cancelar" (esquerda)
  - "Deslize para travar" (cima)
- **Animações suaves**: Transições fluidas entre estados
- **Cores contextuais**:
  - Verde para enviar
  - Vermelho para cancelar/excluir
  - Azul para gravar/pausar

### 📳 Feedback Tátil

- Vibração ao iniciar gravação (impacto médio)
- Vibração ao travar gravação (impacto pesado)
- Vibração ao cancelar (notificação de aviso)
- Vibração ao enviar (notificação de sucesso)
- Vibração ao pausar/retomar (impacto leve/médio)

## Uso

```typescript
import { WhatsAppAudioRecorder } from '@/components/WhatsAppAudioRecorder';

function MyScreen() {
  const handleRecordingComplete = (audioUri: string) => {
    console.log('Áudio gravado:', audioUri);
    // Enviar para API, etc
  };

  const handleCancel = () => {
    console.log('Gravação cancelada');
  };

  return (
    <WhatsAppAudioRecorder
      onRecordingComplete={handleRecordingComplete}
      onCancel={handleCancel}
      disabled={false}
    />
  );
}
```

## Props

| Prop | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `onRecordingComplete` | `(audioUri: string) => void` | Sim | Callback chamado quando gravação é finalizada com sucesso |
| `onCancel` | `() => void` | Não | Callback chamado quando gravação é cancelada |
| `disabled` | `boolean` | Não | Desabilita o componente (padrão: `false`) |

## Estados

O componente possui 3 estados principais:

### 1. **Idle** (Ocioso)
- Estado inicial
- Mostra botão do microfone
- Label: "Segurar para gravar"

### 2. **Recording** (Gravando - Não Travado)
- Gravação ativa, mas não travada
- Timer visível
- Hints de gestos aparecem conforme movimento
- Label: "Deslize para cancelar ou travar"
- Soltar = Enviar

### 3. **Locked** (Gravando - Travado)
- Gravação travada (mãos livres)
- Timer fixo no topo
- Três botões de controle visíveis
- Pode pausar/retomar
- Botão X para cancelar

## Fluxo de Uso

### Gravação Rápida (< 10 segundos)
```
Pressionar → Falar → Soltar
                      ↓
                   Enviar ✅
```

### Gravação com Cancelamento
```
Pressionar → Deslizar ← → Soltar
                          ↓
                      Cancelar ❌
```

### Gravação Longa (Mãos Livres)
```
Pressionar → Deslizar ↑ → Soltar
             ↓
         Travar 🔒
             ↓
    [Pausar] [Excluir] [Enviar]
```

## Implementação Técnica

### Hook Personalizado

Usa `useAudioRecorder` que fornece:
- `startRecording()`: Inicia gravação
- `stopRecording()`: Para e retorna URI
- `pauseRecording()`: Pausa gravação
- `resumeRecording()`: Retoma gravação
- `cancelRecording()`: Cancela e descarta
- `isRecording`: Estado de gravação ativa
- `isPaused`: Estado de pausa
- `recordingDuration`: Duração em segundos

### Gestos

Implementado com `PanResponder`:
- `onPanResponderGrant`: Detecta início do toque
- `onPanResponderMove`: Rastreia movimento do dedo
- `onPanResponderRelease`: Detecta fim do toque
- Threshold de -100px para cancelar (esquerda)
- Threshold de -80px para travar (cima)

### Animações

Usa `Animated` API do React Native:
- `pulseAnim`: Pulsação durante gravação
- `micButtonTranslateX/Y`: Movimento do botão
- `cancelOpacity`: Fade in/out do hint de cancelar
- `lockOpacity`: Fade in/out do hint de travar

## Permissões

O componente solicita automaticamente permissão de microfone:
- No primeiro uso, mostra diálogo do sistema
- Se negada, não permite gravação
- Estado de permissão é mantido no hook

## Formato de Áudio

- **Android**: M4A (AAC), 44.1kHz, estéreo, 128kbps
- **iOS**: M4A (AAC), 44.1kHz, estéreo, 128kbps
- **Web**: WebM, 128kbps

## Acessibilidade

- Touch targets de 44pt mínimo
- Feedback tátil (Haptics) em todas as ações
- Indicadores visuais claros
- Controles grandes e fáceis de tocar no modo travado

## Performance

- Animações rodando no native thread (`useNativeDriver: true`)
- Limpeza adequada de recursos ao desmontar
- Pausa do timer quando pausado (não consome CPU)
- Cleanup automático de gravações ao desmontar componente

## Comparação com WhatsApp

| Recurso | WhatsApp | SmartHoney |
|---------|----------|------------|
| Segurar para gravar | ✅ | ✅ |
| Deslizar para cancelar | ✅ | ✅ |
| Deslizar para travar | ✅ | ✅ |
| Pausar gravação | ❌ | ✅ |
| Feedback tátil | ✅ | ✅ |
| Timer visível | ✅ | ✅ |
| Waveform | ✅ | 🚧 Planejado |

## Melhorias Futuras

- [ ] Visualização de forma de onda (waveform) em tempo real
- [ ] Preview/playback antes de enviar
- [ ] Suporte a marcadores temporais
- [ ] Zoom na forma de onda
- [ ] Edição básica (cortar início/fim)
- [ ] Filtros de áudio (redução de ruído)
- [ ] Compressão de áudio antes de enviar
- [ ] Limite de duração configurável

## Troubleshooting

### Gravação não inicia
- Verifique permissões do microfone
- Teste em dispositivo real (simulador pode ter problemas)
- Verifique logs no console

### Gesto de deslizar não funciona
- Certifique-se de que não há outros PanResponders conflitantes
- Ajuste os thresholds se necessário
- Verifique se `disabled` não está `true`

### Áudio não é enviado
- Verifique se `onRecordingComplete` está implementado
- Confirme que a URI do arquivo é válida
- Teste a conexão de rede

## Referências

- [Expo Audio Documentation](https://docs.expo.dev/versions/latest/sdk/audio/)
- [React Native PanResponder](https://reactnative.dev/docs/panresponder)
- [React Native Animated](https://reactnative.dev/docs/animated)
- [Expo Haptics](https://docs.expo.dev/versions/latest/sdk/haptics/)

---

**Criado:** Novembro 2025
**Última atualização:** Novembro 2025
**Autor:** Smart Honey Team

