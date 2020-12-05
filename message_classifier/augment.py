import random

import pandas as pd

import nlpaug.augmenter.word as naw


def augment_by_class(df, max_n):
    word_index = {}

    for phrase in df['Body']:
        words = phrase.split(' ')
        for word in words:
            word_index[word] = word_index.get(word, 0) + 1

    index_df = pd.DataFrame([{'token': i, 'count': word_index[i]} for i in word_index])
    index_df = index_df[index_df['count'] >= 10]

    aug = naw.SynonymAug(stopwords=index_df['token'])
    aug2 = naw.RandomWordAug()
    factor = (max_n // len(df)) + 2

    result = set()
    for phrase in df['Body']:
        result.add(phrase)
        print(f'Augmenting for {phrase}')
        for item in aug.augment(phrase, n=factor):
            result.add(item)
        for item in aug2.augment(phrase, n=2):
            result.add(item)

    return list(result)


def augment(data_path):
    df = pd.read_csv(data_path)

    spam_messages = list(df[df['Class'] == 'spam']['Body'])
    random.shuffle(spam_messages)

    max_n = len(spam_messages)

    otp_messages = augment_by_class(df[df['Class'] == 'otp'], max_n)
    random.shuffle(otp_messages)

    txn_messages = augment_by_class(df[df['Class'] == 'transaction'], max_n)
    random.shuffle(txn_messages)

    upd_messages = augment_by_class(df[df['Class'] == 'update'], max_n)
    random.shuffle(upd_messages)

    result = []
    for i in spam_messages[:max_n]:
        result.append({'Body': i, 'Class': 'spam'})

    for i in otp_messages[:max_n]:
        result.append({'Body': i, 'Class': 'otp'})

    for i in txn_messages[:max_n]:
        result.append({'Body': i, 'Class': 'transaction'})

    for i in upd_messages[:max_n]:
        result.append({'Body': i, 'Class': 'update'})

    result_df = pd.DataFrame(result)
    print(result_df.groupby('Class').count())
    result_df.to_csv('data/train.csv', index=False)


if __name__ == '__main__':
    augment('data/data.csv')
