import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, type, subject, message } = body;

    // Server-side validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'Invalid name.' }, { status: 400 });
    }
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }
    if (!type || typeof type !== 'string' || type.trim().length === 0) {
      return NextResponse.json({ error: 'Contact type is required.' }, { status: 400 });
    }
    if (!subject || typeof subject !== 'string' || subject.trim().length < 3) {
      return NextResponse.json({ error: 'Subject is required.' }, { status: 400 });
    }
    if (!message || typeof message !== 'string' || message.trim().length < 10) {
      return NextResponse.json({ error: 'Message is too short.' }, { status: 400 });
    }

    // Sanitize inputs (strip dangerous chars)
    const sanitize = (str: string) => str.replace(/<[^>]*>/g, '').trim();

    await EmailService.sendContactForm({
      name: sanitize(name),
      email: sanitize(email),
      type: sanitize(type),
      subject: sanitize(subject),
      message: sanitize(message),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Contact API] Error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

