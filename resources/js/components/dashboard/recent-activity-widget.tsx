import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { ArrowRight, Clock, MessageSquare } from 'lucide-react';

interface ChatSession {
    id: number;
    title: string;
    persona: string | null;
    chat_type: string;
    last_activity_at: string;
    latest_message?: {
        message: string;
        is_ai: boolean;
    };
}

interface RecentActivityWidgetProps {
    recentSessions: ChatSession[];
}

export function RecentActivityWidget({ recentSessions }: RecentActivityWidgetProps) {
    const formatDate = (dateString: string) => {
        try {
            return formatDistanceToNow(new Date(dateString), {
                addSuffix: true,
                locale: id,
            });
        } catch {
            return 'Baru saja';
        }
    };

    const getPersonaBadgeColor = (persona: string | null, chatType: string) => {
        if (chatType === 'global') return 'bg-blue-100 text-blue-700';
        switch (persona) {
            case 'coding':
                return 'bg-purple-100 text-purple-700';
            case 'writer':
                return 'bg-green-100 text-green-700';
            case 'assistant':
                return 'bg-yellow-100 text-yellow-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const getPersonaLabel = (persona: string | null, chatType: string) => {
        if (chatType === 'global') return 'Global';
        return persona ? persona.charAt(0).toUpperCase() + persona.slice(1) : 'Global';
    };

    // Batasi tampilan maksimal 2 item, dan tampilkan keterangan jika lebih dari 3
    const displayedSessions = recentSessions.slice(0, 2);
    const hiddenCount = recentSessions.length > 3 ? recentSessions.length - 2 : 0;

    return (
        <Card className="col-span-full">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-lg font-semibold">Aktivitas Chat Terbaru</CardTitle>
                    {/* Ubah keterangan agar sesuai dengan batas tampilan */}
                    <p className="mt-1 text-sm text-muted-foreground">Menampilkan hingga 2 aktivitas terbaru</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                    <Link href="/chat">
                        Lihat Semua
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardHeader>
            <CardContent>
                {recentSessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground" />
                        <h3 className="mb-2 text-lg font-medium text-muted-foreground">Belum ada chat session</h3>
                        <p className="mb-4 text-sm text-muted-foreground">Mulai percakapan pertama Anda dengan AI</p>
                        <Button asChild>
                            <Link href="/chat">Mulai Chat Baru</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {displayedSessions.map((session) => (
                            <div
                                key={session.id}
                                className="flex items-start justify-between rounded-lg border border-border/50 p-4 transition-colors hover:border-border"
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="mb-2 flex items-center gap-2">
                                        <Link
                                            href={`/chat/${session.id}`}
                                            className="truncate font-medium text-foreground transition-colors hover:text-primary"
                                        >
                                            {session.title}
                                        </Link>
                                        <Badge variant="secondary" className={`text-xs ${getPersonaBadgeColor(session.persona, session.chat_type)}`}>
                                            {getPersonaLabel(session.persona, session.chat_type)}
                                        </Badge>
                                    </div>

                                    {session.latest_message && (
                                        <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">
                                            {session.latest_message.is_ai ? '🤖 ' : '👤 '}
                                            {session.latest_message.message}
                                        </p>
                                    )}

                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        {formatDate(session.last_activity_at)}
                                    </div>
                                </div>

                                <Button variant="ghost" size="sm" asChild>
                                    <Link href={`/chat/${session.id}`}>
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        ))}

                        {hiddenCount > 0 && (
                            <div className="text-xs text-muted-foreground">+{hiddenCount} lainnya</div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
