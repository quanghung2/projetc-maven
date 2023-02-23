import { ConversationGroup, Privacy, User } from '@b3networks/api/workspace';

export class MessageConstants {
  static TIMEOUT = 30 * 60 * 1000; // BE 8h limit
  static TYPING = 3 * 1000;
  static RESEND = 3 * 1000;

  static DEFAULT =
    'Sorry, an error has occurred when we try to fulfill your request. Please try again in a few minutes.';
  static USER_NOT_LOADED = 'An error has occurred when fetching user info.';
  static ME_NOT_LOADED = 'Can not load your information! Try to reload the application again';
  static CON_NOT_ESTABLISH = 'Can not establish new conversation! Please refresh your browser and try again!';
  static JOIN_CONVERSATION_FAILED = 'Can not join new conversation! Please refresh your browser and try again!';
  static CON_HISTORY_NOT_LOADED = 'Error when loading message! Please refresh your browser';

  static MESSAGE_NUMBER = 50;
  static EMAIL_MESSAGE_NUMBER = 5;

  static JOIN_WHEN_CREATE_MESSAGE(me: User, convo: ConversationGroup, members: User[]) {
    const channel = convo.privacy === Privacy.private ? convo.name : `#${convo.name}`;
    if (members && members.length > 0) {
      return `${me.displayName} joined ${channel} along with ${members
        .map(member => member.displayName?.trim())
        .join(', ')}`;
    } else {
      return `${me.displayName} joined ${channel}`;
    }
  }

  static INVITE_MESSAGE(user: User, members: User[]) {
    return `${user.displayName?.trim()} has just invited ${members
      .map(member => member.displayName?.trim())
      .join(', ')} to this conversation`;
  }

  static JOIN_MESSAGE(user: string) {
    return `${user?.trim()} has joined the conversation`;
  }

  static LEAVE_MESSAGE(user: string) {
    return `${user?.trim()} has left the conversation`;
  }

  static ARCHIVE_MESSAGE(user: User) {
    return `${user.displayName?.trim()} has archived this conversation`;
  }

  static REMOVE_MESSAGE(user: User) {
    return `${user.displayName?.trim()} has been removed from this conversation`;
  }

  static EDIT_MESSAGE(me: User, desc: string) {
    return `${me.displayName} set the conversation descripton: ${desc}`;
  }

  static CON_NOT_LOADED(convoName: string) {
    return `Can not load members of conversation ${convoName}`;
  }
  static NOTIFY_NEW_MSG_AGENT_IN_WIDGET(user: string) {
    return `New message from ${user?.trim()}`;
  }
  static NOTIFY_NEW_TXN_IN_CONTACT(contactName: string, type: string) {
    if (!contactName) {
      return `New ${type} from contact`;
    }
    return `New ${type} from ${contactName?.trim()}`;
  }
  static NOTIFY_NEW_MSG_IN_CHANNEL(channel: string) {
    return `New message in #${channel?.trim()}`;
  }
  static NOTIFY_NEW_MSG(user: string) {
    return `New message from ${user?.trim()}`;
  }
  static NOTIFY_NEW_MSG_IN_CONTACT(user: string) {
    if (!!user) {
      return `New message in ${user?.trim()} contact`;
    }
    return `New message in contact`;
  }
  static NOTIFY_NEW_MSG_AGENT_IN_CONTACT(user: string) {
    if (!!user) {
      return `New message from ${user?.trim()} in contact`;
    }
    return `New message in contact`;
  }
  static NOTIFY_NEW_EMAIL(user: string) {
    return `Email from ${user?.trim()}`;
  }
  static NOTIFY_MENTION(fromUser: string) {
    return `${fromUser?.trim()} just mentioned you`;
  }
  static NOTIFY_NEW_ATTACHMENT(user: string) {
    return `${user?.trim()} just sent a file...`;
  }
  static MSG_INVITE(from: string, to: string) {
    return `${from?.trim()} has just invited ${to?.trim()} to this conversation`;
  }
  static CONVER_NOT_FOUND(conversation: string) {
    return `Conversation with id ${conversation?.trim()} not found`;
  }

  static REMOVE_MEMBER_MESSAGE(currentUser: string, removed: string) {
    return `${currentUser?.trim()} has removed ${removed?.trim()} from this conversation`;
  }
  static MSG_TYPING(typingUsers: string[]) {
    if (typingUsers.length >= 3) {
      return 'several uses are typing';
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0]?.trim()} and ${typingUsers[1]?.trim()} are typing`;
    } else if (typingUsers.length === 1) {
      return `${typingUsers[0]?.trim()} is typing`;
    }
    return '';
  }
  static MSG_REPLYING(typingUsers: string[]) {
    if (typingUsers.length >= 3) {
      return 'several uses are replying...';
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0]?.trim()} and ${typingUsers[1]?.trim()} are replying...`;
    } else if (typingUsers.length === 1) {
      return `${typingUsers[0]?.trim()} is replying...`;
    }
    return '';
  }

  static JOIN_CUSTOMER_CONVERSATION(user: string) {
    return `${user?.trim()} joined the conversation`;
  }
  static LEAVE_CUSTOMER_CONVERSATION(user: string) {
    return `${user?.trim()} left the conversation`;
  }
  static FOLLOWED_CUSTOMER_CONVERSATION(user: string) {
    return `${user?.trim()} followed the conversation`;
  }
  static UNFOLLOW_CUSTOMER_CONVERSATION(user: string) {
    return `${user?.trim()} has unfollowed the conversation`;
  }
  static INVITE_CUSTOMER_CONVERSATION(from: string, to: string) {
    return `${from?.trim()} has just invited ${to?.trim()} to this conversation`;
  }
  static ASSIGN_CUSTOMER_CONVERSATION(from: string, to: string) {
    return `${from?.trim()} has assigned this conversation to ${to?.trim()}`;
  }
  static ARCHIVED_CUSTOMER_CONVERSATION(user: string) {
    return `${user?.trim()} has archived this conversation`;
  }

  static JOIN_EMAIL_CONVERSATION(user: string) {
    return `${user?.trim()} joined to this conversation`;
  }
  static LEAVE_EMAIL_CONVERSATION(user: string) {
    return `${user?.trim()} left this conversation`;
  }
  static FOLLOWED_EMAIL_CONVERSATION(user: string) {
    return `${user?.trim()} followed this conversation`;
  }
  static UNFOLLOW_EMAIL_CONVERSATION(user: string) {
    return `${user?.trim()} has unfollowed this conversation`;
  }
  static INVITE_EMAIL_CONVERSATION(from: string, to: string) {
    return `${from?.trim()} assigned this conversation to ${to?.trim()}`;
  }

  static UNARCHIVED_EMAIL_CONVERSATION(user: string) {
    return `${user?.trim()} reopened this conversation`;
  }
  static EMAIL_CONVERSATION_AS_SPAM(user: string) {
    return `${user?.trim()} marked this conversation as spam`;
  }

  static ARCHIVED_CONVERSATION(user: string) {
    return `${user?.trim()} has archived this conversation`;
  }
}
