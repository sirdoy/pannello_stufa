'use client';

import { useState } from 'react';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import Heading from '@/app/components/ui/Heading';
import Text from '@/app/components/ui/Text';
import Badge from '@/app/components/ui/Badge';
import { Copy, Check, ChevronDown, ChevronUp, Clock } from 'lucide-react';

interface EndpointCardProps {
  name: string;
  url: string;
  externalUrl?: string;
  response: any;
  loading: boolean;
  timing?: number;
  onRefresh: () => void;
  onCopyUrl: () => void;
  isCopied: boolean;
}

/**
 * EndpointCard - Display GET endpoint with response
 */
export function EndpointCard({
  name,
  url,
  externalUrl,
  response,
  loading,
  timing,
  onRefresh,
  onCopyUrl,
  isCopied,
}: EndpointCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasError = response?.error || (response && !response.success && response.success !== undefined);

  return (
    <div
      className={`border rounded-lg p-4 transition-colors ${
        hasError
          ? 'border-danger-500/50 bg-danger-500/5'
          : 'border-slate-700 [html:not(.dark)_&]:border-slate-300 bg-slate-800/50 [html:not(.dark)_&]:bg-slate-50'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Heading level={3} size="sm" weight="semibold">
              {name}
            </Heading>
            <Badge variant="ocean" size="sm">
              GET
            </Badge>
            {timing && (
              <span className="flex items-center gap-1 text-xs text-slate-400 [html:not(.dark)_&]:text-slate-600">
                <Clock className="w-3 h-3" />
                {timing}ms
              </span>
            )}
            {hasError && (
              <Badge variant="danger" size="sm">
                Error
              </Badge>
            )}
            {response && !hasError && (
              <Badge variant="sage" size="sm">
                ✓
              </Badge>
            )}
          </div>
          {externalUrl && (
            <div className="flex items-center gap-2 mt-1">
              <code className="text-xs text-slate-400 [html:not(.dark)_&]:text-slate-600 truncate block">
                {externalUrl}
              </code>
              <button
                onClick={onCopyUrl}
                className="flex-shrink-0 p-1 hover:bg-slate-700 [html:not(.dark)_&]:hover:bg-slate-200 rounded transition-colors"
                title="Copy external URL"
              >
                {isCopied ? (
                  <Check className="w-3 h-3 text-green-500" />
                ) : (
                  <Copy className="w-3 h-3 text-slate-400 [html:not(.dark)_&]:text-slate-500" />
                )}
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsExpanded(!isExpanded)} size="sm" variant="ghost">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          <Button onClick={onRefresh} loading={loading} size="sm">
            🔄
          </Button>
        </div>
      </div>

      {isExpanded && response && <JsonDisplay data={response} />}
    </div>
  );
}

/**
 * PostEndpointCard - Display POST endpoint with input fields
 */

interface ApiParam {
  name: string;
  label: string;
  type: string;
  defaultValue: string;
  required?: boolean;
}

interface PostEndpointCardProps {
  name: string;
  url: string;
  externalUrl?: string;
  params?: ApiParam[];
  response: any;
  loading: boolean;
  timing?: number;
  onExecute: (formValues: Record<string, string>) => void;
  onCopyUrl: () => void;
  isCopied: boolean;
}

export function PostEndpointCard({
  name,
  url,
  externalUrl,
  params = [],
  response,
  loading,
  timing,
  onExecute,
  onCopyUrl,
  isCopied,
}: PostEndpointCardProps) {
  const [formValues, setFormValues] = useState<Record<string, string>>(
    params.reduce((acc, param) => ({ ...acc, [param.name]: param.defaultValue }), {} as Record<string, string>)
  );
  const [isExpanded, setIsExpanded] = useState(false);
  const hasError = response?.error || (response && !response.success && response.success !== undefined);

  const handleExecute = () => {
    onExecute(formValues);
    setIsExpanded(true);
  };

  const handleInputChange = (paramName: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [paramName]: value }));
  };

  return (
    <div
      className={`border rounded-lg p-4 transition-colors ${
        hasError
          ? 'border-danger-500/50 bg-danger-500/5'
          : 'border-slate-700 [html:not(.dark)_&]:border-slate-300 bg-slate-800/50 [html:not(.dark)_&]:bg-slate-50'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Heading level={3} size="sm" weight="semibold">
              {name}
            </Heading>
            <Badge variant="warning" size="sm">
              POST
            </Badge>
            {timing && (
              <span className="flex items-center gap-1 text-xs text-slate-400 [html:not(.dark)_&]:text-slate-600">
                <Clock className="w-3 h-3" />
                {timing}ms
              </span>
            )}
            {hasError && (
              <Badge variant="danger" size="sm">
                Error
              </Badge>
            )}
            {response && !hasError && (
              <Badge variant="sage" size="sm">
                ✓
              </Badge>
            )}
          </div>
          {externalUrl && (
            <div className="flex items-center gap-2 mt-1">
              <code className="text-xs text-slate-400 [html:not(.dark)_&]:text-slate-600 truncate block">
                {externalUrl}
              </code>
              <button
                onClick={onCopyUrl}
                className="flex-shrink-0 p-1 hover:bg-slate-700 [html:not(.dark)_&]:hover:bg-slate-200 rounded transition-colors"
                title="Copy external URL"
              >
                {isCopied ? (
                  <Check className="w-3 h-3 text-green-500" />
                ) : (
                  <Copy className="w-3 h-3 text-slate-400 [html:not(.dark)_&]:text-slate-500" />
                )}
              </button>
            </div>
          )}

          {/* Input fields */}
          {params.length > 0 && (
            <div className="mt-3 space-y-2">
              {params.map((param) => (
                <div key={param.name} className="flex items-center gap-3">
                  <Text as="label" size="sm" variant="secondary" className="min-w-[120px]">
                    {param.label}:
                  </Text>
                  {param.type === 'select' ? (
                    <select
                      value={formValues[param.name]}
                      onChange={(e) => handleInputChange(param.name, e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-slate-600 [html:not(.dark)_&]:border-slate-300 rounded-lg bg-slate-800 [html:not(.dark)_&]:bg-white text-slate-100 [html:not(.dark)_&]:text-slate-900"
                    >
                      {param.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={param.type || 'text'}
                      min={param.min}
                      max={param.max}
                      value={formValues[param.name]}
                      onChange={(e) =>
                        handleInputChange(
                          param.name,
                          param.type === 'number' ? parseInt(e.target.value) : e.target.value
                        )
                      }
                      className="flex-1 px-3 py-1.5 border border-slate-600 [html:not(.dark)_&]:border-slate-300 rounded-lg bg-slate-800 [html:not(.dark)_&]:bg-white text-slate-100 [html:not(.dark)_&]:text-slate-900"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {response && (
            <Button onClick={() => setIsExpanded(!isExpanded)} size="sm" variant="ghost">
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          )}
          <Button onClick={handleExecute} loading={loading} size="sm" variant="default">
            Execute
          </Button>
        </div>
      </div>

      {isExpanded && response && <JsonDisplay data={response} />}
    </div>
  );
}

/**
 * JsonDisplay - Formatted JSON with copy button
 */
interface JsonDisplayProps {
  data: any;
}

export function JsonDisplay({ data }: JsonDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 bg-slate-800 [html:not(.dark)_&]:bg-slate-200 hover:bg-slate-700 [html:not(.dark)_&]:hover:bg-slate-300 rounded transition-colors z-10"
        title="Copy JSON"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-green-500" />
        ) : (
          <Copy className="w-3.5 h-3.5 text-slate-400 [html:not(.dark)_&]:text-slate-600" />
        )}
      </button>
      <pre className="mt-2 p-3 bg-slate-900 [html:not(.dark)_&]:bg-slate-900 text-green-400 rounded-lg text-xs overflow-x-auto font-mono">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
