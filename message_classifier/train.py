import json
import random
import pickle

import numpy as np
import pandas as pd

from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split

from tensorflow.python.keras import Sequential
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.python.keras.layers import Embedding, Conv1D, MaxPooling1D, Flatten, Dense, Dropout
from tensorflow.python.keras.preprocessing.sequence import pad_sequences
from tensorflow.python.keras.models import load_model
from tensorflow.python.keras.utils.np_utils import to_categorical


def load_dataset(data_path):
    dataset = pd.read_csv(data_path)
    dataset = dataset.dropna()
    dataset = dataset[dataset['Class'] != '']
    dataset = dataset[dataset['Class'] != 'skip']
    dataset['Body'] = dataset['Body'].str.replace('#', '0')
    return dataset


def get_model(vocab_size, max_len):
    embed_dim = 200

    model = Sequential()
    model.add(Embedding(vocab_size, embed_dim, input_length=max_len))
    model.add(Conv1D(128, 7, activation='relu', padding='same'))
    model.add(MaxPooling1D(pool_size=2))
    model.add(Conv1D(128, 5, activation='relu', padding='same'))
    model.add(MaxPooling1D(pool_size=2))
    model.add(Conv1D(256, 5, activation='relu', padding='same'))
    model.add(MaxPooling1D(pool_size=2))
    model.add(Conv1D(512, 3, activation='relu', padding='same'))
    model.add(MaxPooling1D(pool_size=2))
    model.add(Flatten())
    model.add(Dense(128, activation='relu'))
    model.add(Dropout(0.5))
    model.add(Dense(4, activation='sigmoid'))
    model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])

    return model


def train(train_path):
    # -------------------------- Get data --------------------------

    train_dataset = load_dataset(train_path)

    # -------------------------- Encode classes--------------------------

    encoder = LabelEncoder()
    encoder.fit(train_dataset['Class'])
    train_dataset['Class_encoded'] = LabelEncoder().fit_transform(train_dataset['Class'])

    classes = list(encoder.classes_)

    # -------------------------- Tokenize --------------------------

    tokenizer = Tokenizer(lower=True, split=' ')
    tokenizer.fit_on_texts(train_dataset['Body'].values)

    # Removing low frequency words
    low_count_words = [w for w,c in tokenizer.word_counts.items() if c < 3]
    
    for w in low_count_words:
        del tokenizer.word_index[w]
        del tokenizer.word_docs[w]
        del tokenizer.word_counts[w]

    vocab_size = len(tokenizer.word_index) + 1
    
    max_len = max([len(list(x.split(' '))) for x in train_dataset['Body']])

    X = tokenizer.texts_to_sequences(train_dataset['Body'].values)
    X = pad_sequences(X, padding='post', maxlen=max_len)
    
    Y = to_categorical(np.asarray(train_dataset['Class_encoded']), 4)

    # -------------------------- Split --------------------------

    random_seed = random.randint(1, 1000)
    X_train, X_valid, Y_train, Y_valid = train_test_split(X, Y, test_size=0.20, random_state=random_seed)

    # -------------------------- Get model --------------------------

    model = get_model(vocab_size, max_len)
    model.summary()

    # -------------------------- Train --------------------------

    batch_size = 128
    epochs = 15

    model.fit(x=X_train, y=Y_train, batch_size=batch_size, epochs=epochs)

    model.evaluate(X_valid, Y_valid, verbose=2, batch_size=batch_size)

    # -------------------------- Save --------------------------

    model.save('models/model.h5')

    with open('models/tokenizer.pickle', 'wb') as handle:
        pickle.dump(tokenizer, handle, protocol=pickle.HIGHEST_PROTOCOL)

    word_index = {word: tokenizer.word_index[word] for word in tokenizer.word_index if
                  tokenizer.word_index[word] < vocab_size}

    with open('models/meta.json', 'w') as fp:
        json.dump({'max_len': max_len, 'classes': classes, 'index': word_index}, fp)


def get_text_vector(tokenizer, max_len, texts):
    _texts = tokenizer.texts_to_sequences(texts)
    _texts = pad_sequences(_texts, padding='post', maxlen=max_len)
    return _texts


def eval(data_path):
    test_dataset = load_dataset(data_path)

    with open('models/tokenizer.pickle', 'rb') as handle:
        tokenizer = pickle.load(handle)

    with open('models/meta.json', 'rb') as fp:
        meta = json.load(fp)

    max_len = meta['max_len']
    classes = meta['classes']

    model = load_model('models/model.h5')

    count = 0
    for idx, row in test_dataset.iterrows():
        message = row['Body']
        og_class = row['Class']

        _message = get_text_vector(tokenizer, max_len, [message])
        predictions = model.predict(_message)
        p_class = classes[np.argmax(predictions)]

        if og_class == p_class:
            count += 1
        else:
            pass
            # print(message, og_class, p_class)

    print(count / len(test_dataset))


if __name__ == '__main__':
    # Train on augmented dataset
    train('data/train.csv')

    # Evaluate on original dataset without augmented messages
    eval('data/data.csv')
