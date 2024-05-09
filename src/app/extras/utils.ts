import { FormControl } from '@angular/forms';

import { User } from '../models/User';
import { language2Country } from './language2Country';

export function lastSeen(date: Date) {
  let now = new Date();
  let lastSeen = new Date(date);
  let diff = now.getTime() - lastSeen.getTime();
  let minutes = Math.floor(diff / 60000);
  let hours = Math.floor(minutes / 60);
  let days = Math.floor(hours / 24);
  let months = Math.floor(days / 30);
  let years = Math.floor(months / 12);
  if (years > 0) {
    return years + 'Y';
  } else if (months > 0) {
    return months + 'M';
  } else if (days > 0) {
    return days + 'd';
  } else if (hours > 0) {
    return hours + 'h';
  } else if (minutes > 1) {
    return minutes + 'm';
  } else {
    return 'online';
  }
}

export function lastSeenExt(date: Date) {
  let now = new Date();
  let lastSeen = new Date(date);
  let diff = now.getTime() - lastSeen.getTime();
  let minutes = Math.floor(diff / 60000);
  let hours = Math.floor(minutes / 60);
  let days = Math.floor(hours / 24);
  let months = Math.floor(days / 30);
  let years = Math.floor(months / 12);
  if (years > 0) {
    return years + ' years';
  } else if (months > 0) {
    return months + ' months';
  } else if (days > 0) {
    return days + ' days';
  } else if (hours > 0) {
    return hours + ' hours';
  } else if (minutes > 1) {
    return minutes + ' minutes';
  } else {
    return 'less than a minute';
  }
}

export function messageTime(date: Date) {
  let now = new Date();
  let messageDate = new Date(date);
  let diff = now.getTime() - messageDate.getTime();
  let minutes = Math.floor(diff / 60000);
  let hours = Math.floor(minutes / 60);
  let days = Math.floor(hours / 24);

  let hoursFormat = messageDate.getHours().toString().padStart(2, '0');
  let minutesFormat = messageDate.getMinutes().toString().padStart(2, '0');
  let timeFormat = `${hoursFormat}:${minutesFormat}`;

  if (days > 0) {
    return days + 'd ' + timeFormat;
  } else {
    return timeFormat; // return only the time if the message was sent on the same day
  }
}

export function exactDateAndTime(date: Date) {
  let messageDate = new Date(date);
  let currentDate = new Date();

  let dayFormat = messageDate.getDate().toString().padStart(2, '0');
  let monthFormat = (messageDate.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-based in JavaScript
  let yearFormat = messageDate.getFullYear();

  let hoursFormat = messageDate.getHours().toString().padStart(2, '0');
  let minutesFormat = messageDate.getMinutes().toString().padStart(2, '0');

  let dateFormat = `${dayFormat}.${monthFormat}.${yearFormat}`;
  let timeFormat = `${hoursFormat}:${minutesFormat}`;

  // Calculate the time difference in days, hours, and minutes
  let timeDifference = currentDate.getTime() - messageDate.getTime();
  let days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
  let hours = Math.floor(
    (timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  let minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));

  // If the time difference is less than a day, return the time difference in hours or minutes
  if (days < 1) {
    if (hours > 0) {
      return `${hours} hours ago`;
    } else {
      return `${minutes} minutes ago`;
    }
  }

  // If the time difference is exactly 1 day, return "1 day ago"
  if (days === 1) {
    return `1 day ago at ${timeFormat}`;
  }

  // If the time difference is more than a day, return the time difference in days
  return `${days} days ago at ${timeFormat}`;
}

export function onlineStatus(date: Date) {
  let now = new Date();
  let lastSeen = new Date(date);
  let diff = now.getTime() - lastSeen.getTime();
  let minutes = Math.floor(diff / 60000);
  let hours = Math.floor(minutes / 60);
  let days = Math.floor(hours / 24);

  if (minutes < 60) {
    return 'online';
  } else if (hours < 24) {
    return 'away';
  } else if (days < 7) {
    return 'offline';
  } else {
    return 'none';
  }
}

export function getAge(date: Date) {
  let now = new Date();
  let birthDate = new Date(date);
  let diff = now.getTime() - birthDate.getTime();
  let age = Math.floor(diff / 31557600000);
  return age;
}

export function getBirthdate(age: number) {
  let now = new Date();
  let birthYear = now.getFullYear() - age;
  let birthDate = new Date(birthYear, now.getMonth(), now.getDate());
  return birthDate;
}

export function nameParts(name: string) {
  let result: string = '';
  let parts = name.split(' ');
  if (parts.length > 1) {
    result = parts[0] + ' ' + parts[parts.length - 1].charAt(0) + '.';
  } else {
    result = name;
  }
  return result;
}

export function dateValidator(control: FormControl) {
  const value = control.value;
  const datePattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  if (value && !value.match(datePattern)) {
    return { dateInvalid: true };
  }

  // Create a Date object from the value
  if (value) {
    const [day, month, year] = value.split('/');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    // Check if the date is before 01/01/1925
    const minDate = new Date(1925, 0, 1);
    if (date < minDate) {
      return { dateInvalid: true };
    }
  }

  return null;
}

export function getFlagEmoji(item: User) {
  if (!item || !item['countryCode']) return '';
  const codePoints = item['countryCode']
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

export function getFlagEmoji2(languageCode) {
  const countryCode = language2Country[languageCode];
  if (!countryCode) {
    return '🏳️'; // White flag emoji
  }
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

export function urlify(text: string): Array<{ type: string; content: string }> {
  if (!text || text.length === 0) {
    return [{ type: 'text', content: text }];
  }

  var urlRegex =
    /(\b(https?:\/\/)?[a-z0-9]+([-.][a-z0-9]+)*\.[a-z]{2,}([-a-z0-9@:%_+.~#?&//=]*)\b)/gi;
  let segments = [];
  let match;
  let lastIndex = 0;

  while ((match = urlRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: text.slice(lastIndex, match.index),
      });
    }

    let url = match[0];
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    segments.push({ type: 'url', content: url });

    lastIndex = urlRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return segments;
}
