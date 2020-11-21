import pandas as pd


def get_score(text_a, text_b):
    set_a = set(text_a.split(' '))
    set_b = set(text_b.split(' '))

    intersection = set_a & set_b
    union = set_a | set_b

    return len(intersection) / len(union)


def find_closest_match(text, unique_texts_set):
    cut_off = 0.8
    for item in unique_texts_set:
        score = get_score(text, item)
        if score > cut_off:
            return item

    return None


def parse(data_path):
    df = pd.read_csv(data_path)

    unique_messages_set = set()
    messages = []

    for idx, row in df.iterrows():
        message = row['Body']
        message = message.lower().strip()
        type = row['Class']

        closest_match = find_closest_match(message, unique_messages_set)
        if closest_match is None:
            if type in ['otp', 'transaction', 'update', 'spam']:
                unique_messages_set.add(message)
                messages.append({
                    'body': message,
                    'class': type
                })
        else:
            print(f'Skipping - {idx} : {message}')

    return pd.DataFrame(messages)


if __name__ == '__main__':
    train_data = parse('data/data.csv')
    train_data.to_csv('data/train.csv', index=False)
