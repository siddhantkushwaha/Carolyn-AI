# carolyn_ai
<img  src="https://raw.githubusercontent.com/siddhantkushwaha/Carolyn-Android/master/static/logo_carolyn.svg"  width="40%"/>

This repository classifies any sms into 4 classes : **Spam**, **OTP**, **Transaction**, **Update**
The dataset is made using Indian sms dataset and contains 1138 spam, 345 update, 309 transactional and 165 otp sms. 

## Requirements

The requirements for training the model are :
- Python 3.6 or above
- Tensorflow
- Keras
- Scikit-learn
- Nlpaug (For data augmentation)

## Data Augmentation

Data is balanced using data-augmentation. We have used nlpaug to remove and add random words in update, transactional, otp.
Data Augmentation plays a very important role in classification. After augmentation the data size became 1138 spam, 1388 update, 1236 transactional and 1336 otp.
Refer https://nlpaug.readthedocs.io/en/latest/augmenter/word/random.html for augmentation.
The accuracy changed from 86% to 94% using augmentation.
