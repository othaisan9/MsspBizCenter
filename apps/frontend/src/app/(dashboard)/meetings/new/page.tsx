'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { meetingsApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';

const MEETING_TYPE_OPTIONS = [
  { value: 'regular', label: '정기 회의' },
  { value: 'adhoc', label: '임시 회의' },
  { value: 'review', label: '리뷰 회의' },
  { value: 'retrospective', label: '회고' },
];

export default function NewMeetingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    meetingDate: new Date().toISOString().split('T')[0],
    location: '',
    meetingType: 'regular',
    content: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('제목을 입력하세요.');
      return;
    }

    if (!formData.meetingDate) {
      setError('회의 일시를 선택하세요.');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        title: formData.title.trim(),
        meetingDate: formData.meetingDate,
        meetingType: formData.meetingType,
      };

      if (formData.location.trim()) {
        payload.location = formData.location.trim();
      }

      if (formData.content.trim()) {
        payload.content = formData.content.trim();
      }

      await meetingsApi.create(payload);
      router.push('/meetings');
    } catch (err: any) {
      setError(err.message || '회의록 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">새 회의록</h1>
        <p className="text-sm text-gray-500 mt-1">회의록 정보를 입력하세요.</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <Input
            label="제목"
            name="title"
            type="text"
            required
            maxLength={255}
            placeholder="회의 제목을 입력하세요"
            value={formData.title}
            onChange={handleChange}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="회의 일시"
              name="meetingDate"
              type="date"
              required
              value={formData.meetingDate}
              onChange={handleChange}
            />

            <Select
              label="회의 유형"
              name="meetingType"
              options={MEETING_TYPE_OPTIONS}
              value={formData.meetingType}
              onChange={handleChange}
            />
          </div>

          <Input
            label="장소"
            name="location"
            type="text"
            placeholder="회의 장소 (선택)"
            value={formData.location}
            onChange={handleChange}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              내용 (선택)
            </label>
            <textarea
              name="content"
              rows={10}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="회의 내용을 마크다운 형식으로 입력하세요..."
              value={formData.content}
              onChange={handleChange}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
              disabled={loading}
            >
              취소
            </Button>
            <Button type="submit" loading={loading}>
              저장
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
