import torch
print(torch.version.cuda)
print(torch.cuda.get_device_name(0))
print(torch.backends.cudnn.version())
