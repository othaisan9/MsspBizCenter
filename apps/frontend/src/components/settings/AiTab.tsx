'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { aiSettingsApi, aiApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { User, PROVIDER_OPTIONS } from './types';

interface AiTabProps {
  currentUser: User | null;
}

export function AiTab({ currentUser }: AiTabProps) {
  const [aiSettings, setAiSettings] = useState({
    provider: 'anthropic',
    apiKey: '',
    defaultModel: 'claude-sonnet-4-5-20250929',
    fastModel: 'claude-haiku-4-5-20251001',
    isEnabled: false,
    monthlyBudgetLimit: 0,
    ollamaBaseUrl: 'http://localhost:11434',
  });
  const [aiSettingsLoading, setAiSettingsLoading] = useState(false);
  const [aiSettingsSaving, setAiSettingsSaving] = useState(false);
  const [availableModels, setAvailableModels] = useState<Array<{ value: string; label: string }>>([]);
  const [modelsLoading, setModelsLoading] = useState(false);

  const canAccessAi = currentUser?.role === 'owner' || currentUser?.role === 'admin';

  const fetchAiSettings = useCallback(async () => {
    try {
      setAiSettingsLoading(true);
      const result = await aiSettingsApi.get();
      if (result) {
        setAiSettings({
          provider: result.provider || 'anthropic',
          apiKey: '',
          defaultModel: result.defaultModel || '',
          fastModel: result.fastModel || '',
          isEnabled: result.isEnabled || false,
          monthlyBudgetLimit: result.monthlyBudgetLimit || 0,
          ollamaBaseUrl: result.ollamaBaseUrl || 'http://localhost:11434',
        });
      }
    } catch (error) {
      console.error('Failed to fetch AI settings:', error);
    } finally {
      setAiSettingsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canAccessAi) {
      fetchAiSettings();
    }
  }, [canAccessAi, fetchAiSettings]);

  const fetchModels = useCallback(async () => {
    try {
      setModelsLoading(true);
      const result = await aiApi.listModels({
        provider: aiSettings.provider,
        apiKey: aiSettings.apiKey || undefined,
        ollamaBaseUrl: aiSettings.ollamaBaseUrl || undefined,
      });
      if (result?.models) {
        setAvailableModels(result.models.map((m: { id: string; name: string }) => ({ value: m.id, label: m.name })));
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
      toast.error('모델 목록을 불러오는데 실패했습니다. API 키를 확인해주세요.');
      setAvailableModels([]);
    } finally {
      setModelsLoading(false);
    }
  }, [aiSettings.provider, aiSettings.apiKey, aiSettings.ollamaBaseUrl]);

  const handleSaveAiSettings = async () => {
    try {
      setAiSettingsSaving(true);
      const payload: any = { ...aiSettings };
      if (!payload.apiKey) delete payload.apiKey;
      await aiSettingsApi.update(payload);
      toast.success('AI 설정이 저장되었습니다');
    } catch (error) {
      console.error('Failed to save AI settings:', error);
      toast.error('AI 설정 저장에 실패했습니다');
    } finally {
      setAiSettingsSaving(false);
    }
  };

  if (!canAccessAi) {
    return (
      <Card>
        <div className="text-center py-6">
          <p className="text-gray-600 font-medium">AI 설정은 Owner 또는 Admin만 접근할 수 있습니다</p>
        </div>
      </Card>
    );
  }

  if (aiSettingsLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">AI 어시스턴트 설정</h2>
        <p className="text-sm text-gray-500 mt-1">LLM 프로바이더와 모델을 설정합니다</p>
      </div>

      <Card>
        <div className="space-y-6">
          <Select
            label="LLM 프로바이더"
            value={aiSettings.provider}
            onChange={(e) => {
              const newProvider = e.target.value;
              setAiSettings({
                ...aiSettings,
                provider: newProvider,
                defaultModel: '',
                fastModel: '',
              });
              setAvailableModels([]);
            }}
            options={PROVIDER_OPTIONS}
          />

          {aiSettings.provider !== 'ollama' && (
            <Input
              label="API 키"
              type="password"
              value={aiSettings.apiKey}
              onChange={(e) => setAiSettings({ ...aiSettings, apiKey: e.target.value })}
              placeholder={aiSettings.provider === 'anthropic' ? 'sk-ant-...' : aiSettings.provider === 'gemini' ? 'AIza...' : 'sk-...'}
            />
          )}

          {aiSettings.provider === 'ollama' && (
            <Input
              label="Ollama 서버 URL"
              value={aiSettings.ollamaBaseUrl}
              onChange={(e) => setAiSettings({ ...aiSettings, ollamaBaseUrl: e.target.value })}
              placeholder="http://localhost:11434"
            />
          )}

          <div className="flex justify-end">
            <Button
              size="sm"
              variant="secondary"
              onClick={fetchModels}
              loading={modelsLoading}
            >
              모델 목록 불러오기
            </Button>
          </div>

          <Select
            label="기본 모델 (분석/요약용)"
            value={aiSettings.defaultModel}
            onChange={(e) => setAiSettings({ ...aiSettings, defaultModel: e.target.value })}
            options={availableModels.length > 0
              ? availableModels
              : aiSettings.defaultModel
                ? [{ value: aiSettings.defaultModel, label: aiSettings.defaultModel }]
                : []
            }
          />

          <Select
            label="빠른 모델 (생성/추천용)"
            value={aiSettings.fastModel}
            onChange={(e) => setAiSettings({ ...aiSettings, fastModel: e.target.value })}
            options={availableModels.length > 0
              ? availableModels
              : aiSettings.fastModel
                ? [{ value: aiSettings.fastModel, label: aiSettings.fastModel }]
                : []
            }
          />

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-bold text-gray-800">AI 기능 활성화</label>
              <p className="text-xs text-gray-500">비활성화하면 모든 AI 기능이 숨겨집니다</p>
            </div>
            <button
              onClick={() => setAiSettings({ ...aiSettings, isEnabled: !aiSettings.isEnabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full border-2 border-gray-800 transition-colors ${
                aiSettings.isEnabled ? 'bg-violet-600' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white border border-gray-800 transition-transform ${
                aiSettings.isEnabled ? 'translate-x-5' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSaveAiSettings} disabled={aiSettingsSaving}>
              {aiSettingsSaving ? '저장 중...' : '저장'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
