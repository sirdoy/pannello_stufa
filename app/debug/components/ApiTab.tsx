'use client';

import { useState } from 'react';
import Button from '@/app/components/ui/Button';
import Heading from '@/app/components/ui/Heading';
import InlineSelect from '@/app/components/ui/InlineSelect';
import Text from '@/app/components/ui/Text';
import Badge from '@/app/components/ui/Badge';
import { Copy, Check, ChevronDown, ChevronUp, Clock, RefreshCw } from 'lucide-react';

/**
 * Parsed JSON body of a debug API call (or `{ error }` when the fetch failed)
 */
export interface DebugApiResponse {
  error?: unknown;
  success?: unknown;
  [key: string]: unknown;
}

/**
 * True when the response carries an `error` or an explicit falsy `success`
 */
function responseHasError(response: unknown): boolean {
  if (!response || typeof response !== 'object') return false;
  const { error, success } = response as DebugApiResponse;
  return Boolean(error || (!success && success !== undefined));
}

interface EndpointCardProps {
  name: string;
  url: string;
  externalUrl?: string;
  response: unknown;
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
  url: _url,
  externalUrl,
  response,
  loading,
  timing,
  onRefresh,
  onCopyUrl,
  isCopied,
}: EndpointCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasError = responseHasError(response);

  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${
        hasError
          ? 'border-danger-500/50 bg-danger-500/5'
          : 'border-white/8 bg-white/4'
      }`}
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2">
            <Heading level={3} size="sm">
              {name}
            </Heading>
            <Badge variant="ocean" size="sm">
              GET
            </Badge>
            {timing && (
              <span className="flex items-center gap-1 text-xs text-(--text-2)">
                <Clock className="size-3" />
                {timing}ms
              </span>
            )}
            {hasError && (
              <Badge variant="danger" size="sm">
                Error
              </Badge>
            )}
            {!!response && !hasError && (
              <Badge variant="sage" size="sm" icon={<Check size={12} />}>OK</Badge>
            )}
          </div>
          {externalUrl && (
            <div className="mt-1 flex items-center gap-2">
              <code className="block truncate text-xs text-(--text-2)">
                {externalUrl}
              </code>
              <button
                onClick={onCopyUrl}
                className="shrink-0 rounded p-1 transition-colors hover:bg-white/14"
                title="Copy external URL"
              >
                {isCopied ? (
                  <Check className="size-3 text-green-500" />
                ) : (
                  <Copy className="size-3 text-(--text-2)" />
                )}
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsExpanded(!isExpanded)} size="sm" variant="ghost">
            {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </Button>
          <Button onClick={onRefresh} loading={loading} size="sm">
            <RefreshCw className="size-4" />
          </Button>
        </div>
      </div>

      {isExpanded && !!response && <JsonDisplay data={response} />}
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
  options?: string[];
  min?: number;
  max?: number;
}

export interface PostEndpointCardProps {
  name: string;
  url: string;
  externalUrl?: string;
  params?: ApiParam[];
  response: unknown;
  loading: boolean;
  timing?: number;
  onExecute: (formValues: Record<string, string>) => void;
  onCopyUrl: () => void;
  isCopied: boolean;
}

export function PostEndpointCard({
  name,
  url: _url,
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
  const hasError = responseHasError(response);

  const handleExecute = () => {
    onExecute(formValues);
    setIsExpanded(true);
  };

  const handleInputChange = (paramName: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [paramName]: value }));
  };

  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${
        hasError
          ? 'border-danger-500/50 bg-danger-500/5'
          : 'border-white/8 bg-white/4'
      }`}
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2">
            <Heading level={3} size="sm">
              {name}
            </Heading>
            <Badge variant="warning" size="sm">
              POST
            </Badge>
            {timing && (
              <span className="flex items-center gap-1 text-xs text-(--text-2)">
                <Clock className="size-3" />
                {timing}ms
              </span>
            )}
            {hasError && (
              <Badge variant="danger" size="sm">
                Error
              </Badge>
            )}
            {!!response && !hasError && (
              <Badge variant="sage" size="sm" icon={<Check size={12} />}>OK</Badge>
            )}
          </div>
          {externalUrl && (
            <div className="mt-1 flex items-center gap-2">
              <code className="block truncate text-xs text-(--text-2)">
                {externalUrl}
              </code>
              <button
                onClick={onCopyUrl}
                className="shrink-0 rounded p-1 transition-colors hover:bg-white/14"
                title="Copy external URL"
              >
                {isCopied ? (
                  <Check className="size-3 text-green-500" />
                ) : (
                  <Copy className="size-3 text-(--text-2)" />
                )}
              </button>
            </div>
          )}

          {/* Input fields */}
          {params.length > 0 && (
            <div className="mt-3 space-y-2">
              {params.map((param) => (
                <div key={param.name} className="flex items-center gap-3">
                  <Text as="label" size="sm" variant="secondary" className="min-w-30">
                    {param.label}:
                  </Text>
                  {param.type === 'select' ? (
                    <InlineSelect
                      className="flex-1"
                      value={formValues[param.name]}
                      onChange={(e) => handleInputChange(param.name, e.target.value)}
                    >
                      {param.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </InlineSelect>
                  ) : (
                    <input
                      type={param.type || 'text'}
                      min={param.min}
                      max={param.max}
                      value={formValues[param.name]}
                      onChange={(e) =>
                        handleInputChange(
                          param.name,
                          param.type === 'number' ? e.target.value : e.target.value
                        )
                      }
                      className="flex-1 rounded-lg border border-white/8 bg-white/8 px-3 py-1.5 text-(--text-1)"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!!response && (
            <Button onClick={() => setIsExpanded(!isExpanded)} size="sm" variant="ghost">
              {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </Button>
          )}
          <Button onClick={handleExecute} loading={loading} size="sm" variant="ember">
            Execute
          </Button>
        </div>
      </div>

      {isExpanded && !!response && <JsonDisplay data={response} />}
    </div>
  );
}

/**
 * JsonDisplay - Formatted JSON with copy button
 */
interface JsonDisplayProps {
  data: unknown;
}

function JsonDisplay({ data }: JsonDisplayProps) {
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
        className="absolute top-2 right-2 z-10 rounded bg-white/8 p-1.5 transition-colors hover:bg-white/14"
        title="Copy JSON"
      >
        {copied ? (
          <Check className="size-3.5 text-green-500" />
        ) : (
          <Copy className="size-3.5 text-(--text-2)" />
        )}
      </button>
      <pre className="mt-2 overflow-x-auto rounded-lg bg-black/30 p-3 font-mono text-xs text-green-400">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
